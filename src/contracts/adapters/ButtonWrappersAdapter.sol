// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.0;

import "../interface/IButtonTokenFactory.sol";
import "../interface/IButtonWrapper.sol";
import "../interface/IERC20.sol";
import "../lib/SafeERC20.sol";
import "../YakAdapter.sol";

contract ButtonWrappersAdapter is YakAdapter {
    using SafeERC20 for IERC20;

    address public immutable factory;

    constructor(
        string memory _name,
        address _factory,
        uint256 _swapGasEstimate
    ) YakAdapter(_name, _swapGasEstimate) {
        factory = _factory;
    }

    function _query(
        uint256 _amountIn,
        address _tokenIn,
        address _tokenOut
    ) internal view override returns (uint256 amountOut) {
        if (_tokenIn == _tokenOut || _amountIn == 0) {
            return 0;
        }
        address _factory = factory;
        bool isTokenInWrapperToken = IButtonTokenFactory(_factory).isInstance(_tokenIn);
        bool isTokenOutWrapperToken = IButtonTokenFactory(_factory).isInstance(_tokenOut);
        if (isTokenInWrapperToken && isTokenOutWrapperToken) {
            // Invalid in/out combination, as one ButtonWrapper token can never be the underlying for another
            return 0;
        }
        if (isTokenInWrapperToken) {
            if (IButtonWrapper(_tokenIn).underlying() != _tokenOut) {
                // Invalid in/out combination if the input token's underlying is not the output token
                return 0;
            }
            amountOut = IButtonWrapper(_tokenIn).wrapperToUnderlying(_amountIn);
        } else if (isTokenOutWrapperToken) {
            if (IButtonWrapper(_tokenOut).underlying() != _tokenIn) {
                // Invalid in/out combination if the output token's underlying is not the input token
                return 0;
            }
            amountOut = IButtonWrapper(_tokenOut).underlyingToWrapper(_amountIn);
        }
        // Else return 0
    }

    function _swap(
        uint256 _amountIn,
        uint256, /* _amountOut */
        address _tokenIn,
        address _tokenOut,
        address to
    ) internal override {
        if (IButtonTokenFactory(factory).isInstance(_tokenIn)) {
            IButtonWrapper(_tokenIn).burnTo(to, _amountIn);
        } else {
            IERC20(_tokenIn).safeApprove(_tokenOut, _amountIn);
            IButtonWrapper(_tokenOut).depositFor(to, _amountIn);
        }
    }
}
