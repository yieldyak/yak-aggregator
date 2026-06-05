// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.0;

import "../interface/IERC20.sol";
import "../lib/SafeERC20.sol";
import "../YakAdapter.sol";

interface IAerodromeFactory {
    function getPool(address tokenA, address tokenB, bool stable) external view returns (address);
}

interface IAerodromePool {
    function getAmountOut(uint256 amountIn, address tokenIn) external view returns (uint256);

    function reserve0() external view returns (uint256);
    function reserve1() external view returns (uint256);

    function swap(uint256 amount0Out, uint256 amount1Out, address to, bytes calldata data) external;
}

contract AerodromeAdapter is YakAdapter {
    using SafeERC20 for IERC20;

    address immutable FACTORY;

    constructor(string memory _name, address _factory, uint256 _swapGasEstimate) YakAdapter(_name, _swapGasEstimate) {
        FACTORY = _factory;
    }

    function sortTokens(address tokenA, address tokenB) internal pure returns (address token0, address token1) {
        (token0, token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
    }

    function _getAmountOutSafe(address pool, uint256 amountIn, address tokenIn, address tokenOut)
        internal
        view
        returns (uint256)
    {
        try IAerodromePool(pool).getAmountOut(amountIn, tokenIn) returns (uint256 amountOut) {
            (address token0,) = sortTokens(tokenIn, tokenOut);
            uint256 reserve;
            if (token0 == tokenOut) {
                reserve = IAerodromePool(pool).reserve0();
            } else {
                reserve = IAerodromePool(pool).reserve1();
            }
            return reserve <= amountOut ? 0 : amountOut;
        } catch {
            return 0;
        }
    }

    function getQuoteAndPool(uint256 _amountIn, address _tokenIn, address _tokenOut)
        internal
        view
        returns (uint256 amountOut, address pool)
    {
        uint256 amountStable;
        uint256 amountVolatile;

        address poolStable = IAerodromeFactory(FACTORY).getPool(_tokenIn, _tokenOut, true);
        if (poolStable != address(0)) {
            amountStable = _getAmountOutSafe(poolStable, _amountIn, _tokenIn, _tokenOut);
        }

        address poolVolatile = IAerodromeFactory(FACTORY).getPool(_tokenIn, _tokenOut, false);
        if (poolVolatile != address(0)) {
            amountVolatile = _getAmountOutSafe(poolVolatile, _amountIn, _tokenIn, _tokenOut);
        }

        (amountOut, pool) = amountStable > amountVolatile ? (amountStable, poolStable) : (amountVolatile, poolVolatile);
    }

    function _query(uint256 _amountIn, address _tokenIn, address _tokenOut)
        internal
        view
        override
        returns (uint256 amountOut)
    {
        if (_tokenIn != _tokenOut && _amountIn != 0) (amountOut,) = getQuoteAndPool(_amountIn, _tokenIn, _tokenOut);
    }

    function _swap(uint256 _amountIn, uint256 _amountOut, address _tokenIn, address _tokenOut, address to)
        internal
        override
    {
        (uint256 amountOut, address pool) = getQuoteAndPool(_amountIn, _tokenIn, _tokenOut);
        require(pool != address(0), "Pool not found");
        require(amountOut >= _amountOut, "Insufficient amount out");
        (uint256 amount0Out, uint256 amount1Out) =
            (_tokenIn < _tokenOut) ? (uint256(0), amountOut) : (amountOut, uint256(0));
        IERC20(_tokenIn).safeTransfer(pool, _amountIn);
        IAerodromePool(pool).swap(amount0Out, amount1Out, to, new bytes(0));
    }
}
