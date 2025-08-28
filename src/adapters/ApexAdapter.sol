// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.0;

import "../interface/IApexRouter.sol";
import "../interface/IApexFactory.sol";
import "../interface/IERC20.sol";
import "../interface/IWETH.sol";
import "../lib/SafeERC20.sol";
import "../YakAdapter.sol";

contract ApexAdapter is YakAdapter {
    using SafeERC20 for IERC20;

    address public immutable router;
    address public immutable native;
    address public immutable factory;

    constructor(string memory _name, address _router, address _factory, uint256 _swapGasEstimate, address _native)
        YakAdapter(_name, _swapGasEstimate)
    {
        router = _router;
        native = _native;
        factory = _factory;
    }

    function _query(uint256 _amountIn, address _tokenIn, address _tokenOut)
        internal
        view
        override
        returns (uint256 amountOut)
    {
        if (_tokenIn == _tokenOut || (_tokenIn != native && _tokenOut != native) || _amountIn == 0) {
            return 0;
        }

        try IApexRouter(router).getPair(_tokenIn, _tokenOut) returns (address pair) {
            if (!IApexFactory(factory).isWrappedToken(pair)) {
                return 0;
            }
        } catch {
            return 0;
        }

        address[] memory path = new address[](2);
        path[0] = _tokenIn;
        path[1] = _tokenOut;

        try IApexRouter(router).getAmountsOut(_amountIn, path) returns (uint256[] memory amounts) {
            return amounts[1];
        } catch {
            return 0;
        }
    }

    function _swap(uint256 _amountIn, uint256 _amountOut, address _tokenIn, address _tokenOut, address to)
        internal
        override
    {
        address[] memory path = new address[](2);
        path[0] = _tokenIn;
        path[1] = _tokenOut;

        if (_tokenIn == native) {
            IWETH(native).withdraw(_amountIn);

            uint256[] memory amounts =
                IApexRouter(router).swapExactAVAXForTokens{value: _amountIn}(_amountOut, path, to, block.timestamp + 1);

            require(amounts[1] >= _amountOut, "Insufficient output amount");
        } else {
            IERC20(_tokenIn).approve(address(router), _amountIn);

            uint256[] memory amounts = IApexRouter(router).swapExactTokensForAVAX(
                _amountIn, _amountOut, path, address(this), block.timestamp + 1
            );

            require(amounts[1] >= _amountOut, "Insufficient output amount");

            IWETH(native).deposit{value: amounts[1]}();
            IERC20(native).safeTransfer(to, amounts[1]);
        }
    }
}
