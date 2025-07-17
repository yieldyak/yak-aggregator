// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

library Roles {
    struct Role {
        mapping(address => bool) bearer;
    }

    /**
     * @dev Give an account access to this role.
     */
    function add(Role storage role, address account) internal {
        require(!has(role, account), "Account already has role");
        role.bearer[account] = true;
    }

    /**
     * @dev Remove an account's access to this role.
     */
    function remove(Role storage role, address account) internal {
        require(has(role, account), "Account does not have role");
        role.bearer[account] = false;
    }

    /**
     * @dev Check if an account has this role.
     * @return bool
     */
    function has(Role storage role, address account) internal view returns (bool) {
        require(account != address(0), "Account is the zero address");
        return role.bearer[account];
    }
}

contract BridgeToken is ERC20Burnable {
    using Roles for Roles.Role;

    Roles.Role private bridgeRoles;

    string private TOKEN_NAME;
    string private TOKEN_SYMBOL;
    uint8 private constant TOKEN_DECIMALS = 18;

    struct SwapToken {
        address tokenContract;
        uint256 supply;
    }
    mapping(address => SwapToken) public swapTokens;

    mapping(uint256 => bool) public chainIds;

    event Mint(address to, uint256 amount, address feeAddress, uint256 feeAmount, bytes32 originTxId);
    event Unwrap(uint256 amount, uint256 chainId);
    event AddSupportedChainId(uint256 chainId);
    event MigrateBridgeRole(address newBridgeRoleAddress);
    event AddSwapToken(address contractAddress, uint256 supplyIncrement);
    event RemoveSwapToken(address contractAddress, uint256 supplyDecrement);
    event Swap(address token, uint256 amount);

    constructor(string memory _tokenName, string memory _tokenSymbol) ERC20(_tokenName, _tokenSymbol) {
        TOKEN_NAME = _tokenName;
        TOKEN_SYMBOL = _tokenSymbol;
        bridgeRoles.add(msg.sender);
        chainIds[0] = true;
    }

    function decimals() public view virtual override returns (uint8) {
        return TOKEN_DECIMALS;
    }

    /**
     * @dev Mint function used by bridge. 
        Optional FeeAddress and FeeAmount parameters used to mint small percentage of 
        transfered assets directly to bridge.
     * @param to Address to mint funds to.
     * @param amount Amount of funds to mint.
     * @param feeAddress Address to mint bridge fees to.
     * @param feeAmount Amount to mint as bridge fees.
     * @param feeAmount Amount to mint as bridge fees.
     * @param originTxId Transaction ID from external network that triggered this minting.
     */
    function mint(
        address to,
        uint256 amount,
        address feeAddress,
        uint256 feeAmount,
        bytes32 originTxId
    ) public {
        require(bridgeRoles.has(msg.sender), "Unauthorized.");
        _mint(to, amount);
        if (feeAmount > 0) {
            _mint(feeAddress, feeAmount);
        }
        emit Mint(to, amount, feeAddress, feeAmount, originTxId);
    }

    /**
     * @dev Add new chainId to list of supported Ids.
     * @param chainId ChainId to add.
     */
    function addSupportedChainId(uint256 chainId) public {
        require(bridgeRoles.has(msg.sender), "Unauthorized.");

        // Check that the chain ID is not the chain this contract is deployed on.
        uint256 currentChainId;
        assembly {
            currentChainId := chainid()
        }
        require(chainId != currentChainId, "Cannot add current chain ID.");

        // Already supported, no-op.
        if (chainIds[chainId] == true) {
            return;
        }

        chainIds[chainId] = true;
        emit AddSupportedChainId(chainId);
    }

    /**
     * @dev Burns assets and signals bridge to migrate funds to the same address on the provided chainId.
     * @param amount Amount of asset to unwrap.
     * @param chainId ChainId to unwrap or migrate funds to. Only used for multi-network bridge deployment.
     *                Zero by default for bridge deployment with only 2 networks.
     */
    function unwrap(uint256 amount, uint256 chainId) public {
        require(tx.origin == msg.sender, "Contract calls not supported."); // solhint-disable-line avoid-tx-origin
        require(chainIds[chainId] == true, "Chain ID not supported.");
        _burn(msg.sender, amount);
        emit Unwrap(amount, chainId);
    }

    /**
     * @dev Provide Bridge Role (Admin Role) to new address.
     * @param newBridgeRoleAddress New bridge role address.
     */
    function migrateBridgeRole(address newBridgeRoleAddress) public {
        require(bridgeRoles.has(msg.sender), "Unauthorized.");
        bridgeRoles.remove(msg.sender);
        bridgeRoles.add(newBridgeRoleAddress);
        emit MigrateBridgeRole(newBridgeRoleAddress);
    }

    /**
     * @dev Add Token to accept swaps from or increase supply of existing swap token.
     * @param contractAddress Token Address to allow swaps.
     * @param supplyIncrement Amount of assets allowed to be swapped (or incremental increase in amount).
     */
    function addSwapToken(address contractAddress, uint256 supplyIncrement) public {
        require(bridgeRoles.has(msg.sender), "Unauthorized.");
        require(isContract(contractAddress), "Address is not contract.");

        // If the swap token is not already supported, add it with the total supply of supplyIncrement.
        // Otherwise, increment the current supply.
        if (swapTokens[contractAddress].tokenContract == address(0)) {
            swapTokens[contractAddress] = SwapToken({ tokenContract: contractAddress, supply: supplyIncrement });
        } else {
            swapTokens[contractAddress].supply = swapTokens[contractAddress].supply + supplyIncrement;
        }
        emit AddSwapToken(contractAddress, supplyIncrement);
    }

    /**
     * @dev Remove amount of swaps allowed from existing swap token.
     * @param contractAddress Token Address to remove swap amount.
     * @param supplyDecrement Amount to remove from the swap supply.
     */
    function removeSwapToken(address contractAddress, uint256 supplyDecrement) public {
        require(bridgeRoles.has(msg.sender), "Unauthorized");
        require(isContract(contractAddress), "Address is not contract.");
        require(swapTokens[contractAddress].tokenContract != address(0), "Swap token not supported");

        // If the decrement is less than the current supply, decrement it from the current supply.
        // Otherwise, if the decrement is greater than or equal to the current supply, delete the mapping value.
        if (swapTokens[contractAddress].supply > supplyDecrement) {
            swapTokens[contractAddress].supply = swapTokens[contractAddress].supply - supplyDecrement;
        } else {
            delete swapTokens[contractAddress];
        }
        emit RemoveSwapToken(contractAddress, supplyDecrement);
    }

    /**
     * @dev Fetch the remaining amount allowed for a swap token.
     * @param token Address of swap token.
     * @return amount of swaps remaining.
     */
    function swapSupply(address token) public view returns (uint256) {
        return swapTokens[token].supply;
    }

    /**
     * @dev Perform Swap.
     * @param token Address of token to be swapped.
     * @param amount Amount of token to be swapped.
     */
    function swap(address token, uint256 amount) public {
        require(isContract(token), "Token is not a contract.");
        require(swapTokens[token].tokenContract != address(0), "Swap token is not a contract.");
        require(amount <= swapTokens[token].supply, "Swap amount is more than supply.");

        // Update the allowed swap amount.
        swapTokens[token].supply = swapTokens[token].supply - amount;

        // Burn the old token.
        ERC20Burnable swapToken = ERC20Burnable(swapTokens[token].tokenContract);
        swapToken.burnFrom(msg.sender, amount);

        // Mint the new token.
        _mint(msg.sender, amount);

        emit Swap(token, amount);
    }

    /**
     * @dev Check if provided address is a contract.
     * @param addr Address to check.
     * @return hasCode
     */
    function isContract(address addr) private view returns (bool hasCode) {
        uint256 length;
        assembly {
            length := extcodesize(addr)
        }
        return length > 0;
    }

    // @notice: This is added for dev reasons
    function mint(address _to, uint256 _amount) public {
        _mint(_to, _amount);
    }
}
