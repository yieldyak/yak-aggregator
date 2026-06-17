// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.0;

import "../interface/IERC20.sol";
import "../lib/SafeERC20.sol";
import "../YakAdapter.sol";

interface IAerodromeCLFactory {
    function getPool(address tokenA, address tokenB, int24 tickSpacing) external view returns (address pool);

    function tickSpacings() external view returns (int24[] memory);
}

interface IAerodromeCLPool {
    function swap(
        address recipient,
        bool zeroForOne,
        int256 amountSpecified,
        uint160 sqrtPriceLimitX96,
        bytes calldata data
    ) external returns (int256 amount0, int256 amount1);

    function token0() external view returns (address);

    function token1() external view returns (address);

    function liquidity() external view returns (uint128);

    function ticks(int24 tick)
        external
        view
        returns (
            uint128 liquidityGross,
            int128 liquidityNet,
            int128 stakedLiquidityNet,
            uint256 feeGrowthOutside0X128,
            uint256 feeGrowthOutside1X128,
            int56 tickCumulativeOutside,
            uint160 secondsPerLiquidityOutsideX128,
            uint32 secondsOutside,
            bool initialized
        );
}

interface IAerodromeCLStaticQuoter {
    struct QuoteExactInputSingleParams {
        address tokenIn;
        address tokenOut;
        uint256 amountIn;
        uint24 fee;
        uint160 sqrtPriceLimitX96;
    }

    function quoteExactInputSingle(QuoteExactInputSingleParams memory params) external view returns (uint256 amountOut);

    function quoteExactInput(bytes memory path, uint256 amountIn) external view returns (uint256 amountOut);
}

contract AerodromeCLAdapter is YakAdapter {
    using SafeERC20 for IERC20;

    uint160 internal constant MAX_SQRT_RATIO = 1461446703485210103287273052203988822378723970342;
    uint160 internal constant MIN_SQRT_RATIO = 4295128739;

    IAerodromeCLStaticQuoter public immutable staticQuoter;
    address public immutable FACTORY;

    constructor(string memory _name, uint256 _swapGasEstimate, address _staticQuoter, address _factory)
        YakAdapter(_name, _swapGasEstimate)
    {
        staticQuoter = IAerodromeCLStaticQuoter(_staticQuoter);
        FACTORY = _factory;
    }

    function getTickSpacings() external view returns (int24[] memory) {
        return IAerodromeCLFactory(FACTORY).tickSpacings();
    }

    function _query(uint256 _amountIn, address _tokenIn, address _tokenOut)
        internal
        view
        override
        returns (uint256 amountOut)
    {
        if (_tokenIn != _tokenOut && _amountIn != 0) {
            (, amountOut,) = _findBestPool(_amountIn, _tokenIn, _tokenOut);
        }
    }

    function _swap(uint256 _amountIn, uint256 _amountOut, address _tokenIn, address _tokenOut, address _to)
        internal
        override
    {
        (address pool, uint256 bestAmountOut, int24 tickSpacing) = _findBestPool(_amountIn, _tokenIn, _tokenOut);

        require(pool != address(0), "Pool not found");
        require(bestAmountOut >= _amountOut, "Insufficient amountOut");

        (bool zeroForOne, uint160 priceLimit) = getZeroOneAndSqrtPriceLimitX96(_tokenIn, _tokenOut);
        (int256 amount0, int256 amount1) = IAerodromeCLPool(pool)
            .swap(address(this), zeroForOne, int256(_amountIn), priceLimit, abi.encode(tickSpacing));

        uint256 amountOut = zeroForOne ? uint256(-amount1) : uint256(-amount0);
        require(amountOut >= _amountOut, "Insufficient output");
        _returnTo(_tokenOut, amountOut, _to);
    }

    function _findBestPool(uint256 amountIn, address tokenIn, address tokenOut)
        internal
        view
        returns (address bestPool, uint256 bestAmountOut, int24 bestTickSpacing)
    {
        int24[] memory tickSpacings = IAerodromeCLFactory(FACTORY).tickSpacings();
        for (uint256 i; i < tickSpacings.length; ++i) {
            int24 tickSpacing = tickSpacings[i];
            address pool = IAerodromeCLFactory(FACTORY).getPool(tokenIn, tokenOut, tickSpacing);
            if (pool == address(0) || IAerodromeCLPool(pool).liquidity() == 0) {
                continue;
            }

            uint256 quote = _getQuoteSafe(amountIn, tokenIn, tokenOut, tickSpacing);
            if (quote > bestAmountOut) {
                bestPool = pool;
                bestAmountOut = quote;
                bestTickSpacing = tickSpacing;
            }
        }
    }

    function _getQuoteSafe(uint256 amountIn, address tokenIn, address tokenOut, int24 tickSpacing)
        internal
        view
        returns (uint256 quote)
    {
        IAerodromeCLStaticQuoter.QuoteExactInputSingleParams memory params =
            IAerodromeCLStaticQuoter.QuoteExactInputSingleParams({
                tokenIn: tokenIn, tokenOut: tokenOut, amountIn: amountIn, fee: uint24(tickSpacing), sqrtPriceLimitX96: 0
            });

        try staticQuoter.quoteExactInputSingle(params) returns (uint256 amountOut) {
            quote = amountOut;
        } catch {
            quote = 0;
        }
    }

    function uniswapV3SwapCallback(int256 amount0Delta, int256 amount1Delta, bytes calldata data) external {
        int24 tickSpacing = abi.decode(data, (int24));

        address token0 = IAerodromeCLPool(msg.sender).token0();
        address token1 = IAerodromeCLPool(msg.sender).token1();
        require(IAerodromeCLFactory(FACTORY).getPool(token0, token1, tickSpacing) == msg.sender, "Invalid callback");

        if (amount0Delta > 0) {
            IERC20(token0).safeTransfer(msg.sender, uint256(amount0Delta));
        } else if (amount1Delta > 0) {
            IERC20(token1).safeTransfer(msg.sender, uint256(amount1Delta));
        }
    }

    function getZeroOneAndSqrtPriceLimitX96(address tokenIn, address tokenOut)
        internal
        pure
        returns (bool zeroForOne, uint160 sqrtPriceLimitX96)
    {
        zeroForOne = tokenIn < tokenOut;
        sqrtPriceLimitX96 = zeroForOne ? MIN_SQRT_RATIO + 1 : MAX_SQRT_RATIO - 1;
    }
}
