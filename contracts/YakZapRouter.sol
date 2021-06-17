//       ╟╗                                                                      ╔╬
//       ╞╬╬                                                                    ╬╠╬
//      ╔╣╬╬╬                                                                  ╠╠╠╠╦
//     ╬╬╬╬╬╩                                                                  ╘╠╠╠╠╬
//    ║╬╬╬╬╬                                                                    ╘╠╠╠╠╬
//    ╣╬╬╬╬╬╬╬╬╬╬╬╬╬╬╬      ╒╬╬╬╬╬╬╬╜   ╠╠╬╬╬╬╬╬╬         ╠╬╬╬╬╬╬╬    ╬╬╬╬╬╬╬╬╠╠╠╠╠╠╠╠
//    ╙╬╬╬╬╬╬╬╬╬╬╬╬╬╬╬╬╕    ╬╬╬╬╬╬╬╜   ╣╠╠╬╬╬╬╬╬╬╬        ╠╬╬╬╬╬╬╬   ╬╬╬╬╬╬╬╬╬╠╠╠╠╠╠╠╩
//     ╙╣╬╬╬╬╬╬╬╬╬╬╬╬╬╬╬  ╔╬╬╬╬╬╬╬    ╔╠╠╠╬╬╬╬╬╬╬╬        ╠╬╬╬╬╬╬╬ ╣╬╬╬╬╬╬╬╬╬╬╬╠╠╠╠╝╙
//               ╘╣╬╬╬╬╬╬╬╬╬╬╬╬╬╬    ╒╠╠╠╬╠╬╩╬╬╬╬╬╬       ╠╬╬╬╬╬╬╬╣╬╬╬╬╬╬╬╙
//                 ╣╬╬╬╬╬╬╬╬╬╬╠╣     ╣╬╠╠╠╬╩ ╚╬╬╬╬╬╬      ╠╬╬╬╬╬╬╬╬╬╬╬╬╬╬
//                  ╣╬╬╬╬╬╬╬╬╬╣     ╣╬╠╠╠╬╬   ╣╬╬╬╬╬╬     ╠╬╬╬╬╬╬╬╬╬╬╬╬╬╬
//                   ╟╬╬╬╬╬╬╬╩      ╬╬╠╠╠╠╬╬╬╬╬╬╬╬╬╬╬     ╠╬╬╬╬╬╬╬╠╬╬╬╬╬╬╬
//                    ╬╬╬╬╬╬╬     ╒╬╬╠╠╬╠╠╬╬╬╬╬╬╬╬╬╬╬╬    ╠╬╬╬╬╬╬╬ ╣╬╬╬╬╬╬╬
//                    ╬╬╬╬╬╬╬     ╬╬╬╠╠╠╠╝╝╝╝╝╝╝╠╬╬╬╬╬╬   ╠╬╬╬╬╬╬╬  ╚╬╬╬╬╬╬╬╬
//                    ╬╬╬╬╬╬╬    ╣╬╬╬╬╠╠╩       ╘╬╬╬╬╬╬╬  ╠╬╬╬╬╬╬╬   ╙╬╬╬╬╬╬╬╬
//                              

// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;

import "./interface/IUnilikeFactory.sol";
import "./interface/IUnilikePair.sol";
import "./interface/IWAVAX.sol";
import "./interface/IDepositFor.sol";
import "./interface/IERC20.sol";
import "./lib/SafeMath.sol";

contract YakZapRouter {
    using SafeMath for uint;

    IUnilikeFactory public immutable factory;
    address public immutable WAVAX = 0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7;
    
    // baguette: 81dbf51ab39dc634785936a3b34def28bf8007e6dfa30d4284c4b8547cb47a51
    // source: https://github.com/baguette-exchange/contracts/blob/master/contracts/baguette-periphery/libraries/BaguetteLibrary.sol#L25
    // pangolin: 40231f6b438bce0797c9ada29b718a87ea0a5cea3fe9a771abdd76bd41a3e545
    // source: https://github.com/pangolindex/exchange-contracts/blob/main/contracts/pangolin-periphery/libraries/PangolinLibrary.sol#L25
    bytes32 public immutable pairInitCode;

    event YakZapAddLiquidity(
        uint amountA,
        uint amountB,
        uint liquidity
    );

    constructor(
        address _factory,
        bytes32 _pairInitCode
    ) {
        factory = IUnilikeFactory(_factory);
        pairInitCode = _pairInitCode;
    }
    
    receive() external payable {
        // only accept AVAX via fallback from the WAVAX contract
        // this prevent possible attacks where people try to bork contract
        // by sending additional values
        assert(msg.sender == WAVAX); 
    }

    /**
     * @notice Safely transfer from a third party user using an anonymous ERC20 token
     * @dev Requires token to return true on transfer
     * @param token address
     * @param from sender address
     * @param to recipient address
     * @param value amount
     */
    function _safeTransferFrom( address token, address from, address to, uint256 value) private {
        require(IERC20(token).transferFrom(from, to, value), 'TransferHelper: TRANSFER_FROM_FAILED');
    }

    /**
     * @notice Safely transfer AVAX
     * @dev Requires token to return true on transfer
     * @param to recipient address
     * @param value amount
     */
    function _safeTransferAVAX(address to, uint256 value) internal {
        (bool success, ) = to.call{value: value}(new bytes(0));
        require(success, 'TransferHelper: AVAX_TRANSFER_FAILED');
    }

    // safety measure to prevent clear front-running by delayed block
    modifier ensure(uint deadline) {
        require(deadline >= block.timestamp, 'DexZapV1: EXPIRED');
        _;
    }

    /** 
     * @notice Given two tokens, it'll return the tokens in the right order for the tokens pair
     * @dev TokenA must be different from TokenB, and both shouldn't be address(0), no validations
     * @param tokenA address
     * @param tokenB address
     * @return sorted tokens
     */
    function _sortTokens(address tokenA, address tokenB) private pure returns (address, address) {
        return tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
    }
    
    /**
     * @notice Given two tokens, it'll return the address of the two tokens pair
     * @dev The address of the pair doesn't mean the pair exists
     * @param tokenA address of the first token
     * @param tokenB address of the second token
     * @return pair tokenA-tokenB address
     */
    function pairFor(address tokenA, address tokenB) internal view returns (address pair) {
        (address token0, address token1) = _sortTokens(tokenA, tokenB);
        pair = address(uint(keccak256(abi.encodePacked(
            hex'ff',
            address(factory),
            keccak256(abi.encodePacked(token0, token1)),
            pairInitCode
        ))));
    }

    function addLiquidity(
        address tokenA,
        address tokenB,
        uint amountADesired,
        uint amountBDesired,
        uint amountAMin,
        uint amountBMin,
        address to,
        address strategyAddress,
        uint deadline
    ) external ensure(deadline) returns (uint amountA, uint amountB, uint liquidity) {
        address pair = pairFor(tokenA, tokenB);
        (amountA, amountB) = _addLiquidity(tokenA, tokenB, amountADesired, amountBDesired, amountAMin, amountBMin);
        _safeTransferFrom(tokenA, msg.sender, pair, amountA);
        _safeTransferFrom(tokenB, msg.sender, pair, amountB);
        liquidity = IUnilikePair(pair).mint(address(this));
        _allowPair(pair, strategyAddress, liquidity);
        IDepositFor(strategyAddress).depositFor(to, liquidity);
        emit YakZapAddLiquidity(amountA, amountB, liquidity);
    }

    function addLiquidityAVAX(
        address token,
        uint amountTokenDesired,
        uint amountTokenMin,
        uint amountAVAXMin,
        address to,
        address strategyAddress,
        uint deadline
    ) external payable ensure(deadline) returns (uint amountToken, uint amountAVAX, uint liquidity) {
        address pair = pairFor(token, WAVAX);
        (amountToken, amountAVAX) = _addLiquidity(token, WAVAX, amountTokenDesired, msg.value, amountTokenMin, amountAVAXMin);
        _safeTransferFrom(token, msg.sender, pair, amountToken);
        IWAVAX(WAVAX).deposit{value: amountAVAX}();
        assert(IWAVAX(WAVAX).transfer(pair, amountAVAX));
        liquidity = IUnilikePair(pair).mint(address(this));
        _allowPair(pair, strategyAddress, liquidity);
        IDepositFor(strategyAddress).depositFor(to, liquidity);
        if (msg.value > amountAVAX) _safeTransferAVAX(msg.sender, msg.value - amountAVAX);
        emit YakZapAddLiquidity(amountToken, amountAVAX, liquidity);
    }

    /**
     * @notice Allows the strategy to transfer the depositToken minted from the pair in this contract
     * @param pairAddress Pair ERC that will be transferred from here to the strategy
     * @param strategyAddress Strategy address
     * @param liquidity The amount of liquidity being transferred in this operation
     */
    function _allowPair(address pairAddress, address strategyAddress, uint liquidity) internal {
        if (IERC20(pairAddress).allowance(address(this), strategyAddress) <= liquidity) {
            IERC20(pairAddress).approve(strategyAddress, uint(-1));
        }
    }

    /**
     * @notice Gets the reserves of tokenA and tokenB from it's liquidity pair
     * @dev This doesn't validate whether the pair exists, this validation needs to be done before
     * @param tokenA address
     * @param tokenB address
     */
    function getReserves(address tokenA, address tokenB) internal view returns (uint reserveA, uint reserveB) {
        (address token0,) = _sortTokens(tokenA, tokenB);
        (uint reserve0, uint reserve1,) = IUnilikePair(pairFor(tokenA, tokenB)).getReserves();
        (reserveA, reserveB) = tokenA == token0 ? (reserve0, reserve1) : (reserve1, reserve0);
    }

    /**
     * @notice Given the reserves, and the amount of tokenA, it'll quote how many tokenB needs to be used
     * @dev Ensure provided reserveA matches tokenA, otherwise, revert the reserves before feeding in this function
     * @param amountA Quantity of tokenA
     * @param reserveA Reserve of tokenA in the liquidity Pair
     * @param reserveB Reserve of tokenB in the liquidity Pair
     * @return amountB The amount of tokenB to fit tokenA according to the liquidity pair
     */
    function quote(uint amountA, uint reserveA, uint reserveB) internal pure returns (uint amountB) {
        require(amountA > 0, 'DexZapV1: INSUFFICIENT_AMOUNT');
        require(reserveA > 0 && reserveB > 0, 'DexZapV1: INSUFFICIENT_LIQUIDITY');
        amountB = amountA.mul(reserveB) / reserveA;
    }

    /**
     * @notice Computes the exact amount of TokenA and TokenB needed to mint the liquidity token
     * @dev Doesn't allow to compute on pairs that don't exist yet, and don't create the pairs as this can be a complex flow
     * @param tokenA address
     * @param tokenB address
     * @param amountADesired this is the maximum amount of tokenA to be used
     * @param amountBDesired this is the maximum amount of tokenB to be used
     * @param amountAMin this is the minimum amount of tokenA to be used
     * @param amountBMin this is the minimum amount of tokenB to be used
     */
    function _addLiquidity(
        address tokenA,
        address tokenB,
        uint amountADesired,
        uint amountBDesired,
        uint amountAMin,
        uint amountBMin
    ) internal virtual returns (uint amountA, uint amountB) {
        // fail if the pair doesn't exist yet
        require(factory.getPair(tokenA, tokenB) != address(0), "DexZapV1::_addLiquidity pair still doesn't exist");
        (uint reserveA, uint reserveB) = getReserves(tokenA, tokenB);
        if (reserveA == 0 && reserveB == 0) {
            (amountA, amountB) = (amountADesired, amountBDesired);
        } else {
            uint amountBOptimal = quote(amountADesired, reserveA, reserveB);
            if (amountBOptimal <= amountBDesired) {
                require(amountBOptimal >= amountBMin, 'DexZapV1: INSUFFICIENT_B_AMOUNT');
                (amountA, amountB) = (amountADesired, amountBOptimal);
            } else {
                uint amountAOptimal = quote(amountBDesired, reserveB, reserveA);
                assert(amountAOptimal <= amountADesired);
                require(amountAOptimal >= amountAMin, 'DexZapV1: INSUFFICIENT_A_AMOUNT');
                (amountA, amountB) = (amountAOptimal, amountBDesired);
            }
        }
    }
}