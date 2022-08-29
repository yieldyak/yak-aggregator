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
pragma solidity ^0.8.0;

import "./interface/IERC20.sol";
import "./interface/IWETH.sol";
import "./lib/SafeERC20.sol";
import "./lib/Ownable.sol";

abstract contract YakAdapter is Ownable {
    using SafeERC20 for IERC20;

    event YakAdapterSwap(address indexed _tokenFrom, address indexed _tokenTo, uint256 _amountIn, uint256 _amountOut);

    event UpdatedGasEstimate(address indexed _adapter, uint256 _newEstimate);

    event Recovered(address indexed _asset, uint256 amount);

    address internal constant WAVAX = 0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7;
    address internal constant AVAX = address(0);
    uint256 internal constant UINT_MAX = type(uint256).max;

    uint256 public swapGasEstimate;
    string public name;

    function setSwapGasEstimate(uint256 _estimate) public onlyOwner {
        swapGasEstimate = _estimate;
        emit UpdatedGasEstimate(address(this), _estimate);
    }

    /**
     * @notice Revoke token allowance
     * @param _token address
     * @param _spender address
     */
    function revokeAllowance(address _token, address _spender) external onlyOwner {
        IERC20(_token).safeApprove(_spender, 0);
    }

    /**
     * @notice Recover ERC20 from contract
     * @param _tokenAddress token address
     * @param _tokenAmount amount to recover
     */
    function recoverERC20(address _tokenAddress, uint256 _tokenAmount) external onlyOwner {
        require(_tokenAmount > 0, "YakAdapter: Nothing to recover");
        IERC20(_tokenAddress).safeTransfer(msg.sender, _tokenAmount);
        emit Recovered(_tokenAddress, _tokenAmount);
    }

    /**
     * @notice Recover AVAX from contract
     * @param _amount amount
     */
    function recoverAVAX(uint256 _amount) external onlyOwner {
        require(_amount > 0, "YakAdapter: Nothing to recover");
        payable(msg.sender).transfer(_amount);
        emit Recovered(address(0), _amount);
    }

    function query(
        uint256 _amountIn,
        address _tokenIn,
        address _tokenOut
    ) external view returns (uint256) {
        return _query(_amountIn, _tokenIn, _tokenOut);
    }

    /**
     * Execute a swap from token to token assuming this contract already holds input tokens
     * @notice Interact through the router
     * @param _amountIn input amount in starting token
     * @param _amountOut amount out in ending token
     * @param _fromToken ERC20 token being sold
     * @param _toToken ERC20 token being bought
     * @param _to address where swapped funds should be sent to
     */
    function swap(
        uint256 _amountIn,
        uint256 _amountOut,
        address _fromToken,
        address _toToken,
        address _to
    ) external {
        _approveIfNeeded(_fromToken, _amountIn);
        _swap(_amountIn, _amountOut, _fromToken, _toToken, _to);
        emit YakAdapterSwap(_fromToken, _toToken, _amountIn, _amountOut);
    }

    /**
     * @notice Return expected funds to user
     * @dev Skip if funds should stay in the contract
     * @param _token address
     * @param _amount tokens to return
     * @param _to address where funds should be sent to
     */
    function _returnTo(
        address _token,
        uint256 _amount,
        address _to
    ) internal {
        if (address(this) != _to) {
            IERC20(_token).safeTransfer(_to, _amount);
        }
    }

    /**
     * @notice Wrap AVAX
     * @param _amount amount
     */
    function _wrap(uint256 _amount) internal {
        IWETH(WAVAX).deposit{ value: _amount }();
    }

    /**
     * @notice Unwrap WAVAX
     * @param _amount amount
     */
    function _unwrap(uint256 _amount) internal {
        IWETH(WAVAX).withdraw(_amount);
    }

    /**
     * @notice Internal implementation of a swap
     * @dev Must return tokens to address(this)
     * @dev Wrapping is handled external to this function
     * @param _amountIn amount being sold
     * @param _amountOut amount being bought
     * @param _fromToken ERC20 token being sold
     * @param _toToken ERC20 token being bought
     * @param _to Where recieved tokens are sent to
     */
    function _swap(
        uint256 _amountIn,
        uint256 _amountOut,
        address _fromToken,
        address _toToken,
        address _to
    ) internal virtual;

    function _query(
        uint256 _amountIn,
        address _tokenIn,
        address _tokenOut
    ) internal view virtual returns (uint256);

    /**
     * @notice Approve tokens for use in Strategy
     * @dev Should use modifier `onlyOwner` to avoid griefing
     */
    function setAllowances() public virtual;

    function _approveIfNeeded(address _tokenIn, uint256 _amount) internal virtual;

    receive() external payable {}
}
