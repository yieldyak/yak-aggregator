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

import "../interface/IERC20.sol";
import "../lib/SafeERC20.sol";
import "../YakAdapter.sol";

struct QParams {
    address tokenIn;
    address tokenOut;
    int256 amountIn;
    uint24 fee;
}

interface IUniV3Pool {
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
}

interface IUniV3Quoter {
    function quoteExactInputSingle(QParams memory params) external view returns (uint256);

    function quote(
        address,
        bool,
        int256,
        uint160
    ) external view returns (int256, int256);
}

abstract contract UniswapV3likeAdapter is YakAdapter {
    using SafeERC20 for IERC20;

    uint160 internal constant MAX_SQRT_RATIO = 1461446703485210103287273052203988822378723970342;
    uint160 internal constant MIN_SQRT_RATIO = 4295128739;
    address immutable FACTORY;
    address immutable QUOTER;
    mapping(address => mapping(address => uint256[])) paths;

    constructor(
        string memory _name,
        address _factory,
        address _quoter,
        uint256 _swapGasEstimate
    ) YakAdapter(_name, _swapGasEstimate) {
        FACTORY = _factory;
        QUOTER = _quoter;
    }

    function getQuoteForPool(
        address pool,
        int256 amountIn,
        address tokenIn,
        address tokenOut
    ) external view returns (uint256) {
        QParams memory params;
        params.amountIn = amountIn;
        params.tokenIn = tokenIn;
        params.tokenOut = tokenOut;
        return getQuoteForPool(pool, params);
    }

    function _query(
        uint256 _amountIn,
        address _tokenIn,
        address _tokenOut
    ) internal view override returns (uint256 quote) {
        QParams memory params = getQParams(_amountIn, _tokenIn, _tokenOut);
        quote = getQuoteForMostLiquidPool(params);
    }

    function _swap(
        uint256 _amountIn,
        uint256 _amountOut,
        address _tokenIn,
        address _tokenOut,
        address _to
    ) internal override {
        QParams memory params = getQParams(_amountIn, _tokenIn, _tokenOut);
        uint256 amountOut = _underlyingSwap(params, new bytes(0));
        require(amountOut >= _amountOut, "Insufficient amountOut");
        _returnTo(_tokenOut, amountOut, _to);
    }

    function getQParams(
        uint256 amountIn,
        address tokenIn,
        address tokenOut
    ) internal pure returns (QParams memory params) {
        params = QParams({ tokenIn: tokenIn, tokenOut: tokenOut, amountIn: int256(amountIn), fee: 0 });
    }

    function _underlyingSwap(QParams memory params, bytes memory callbackData) internal returns (uint256) {
        address pool = getMostLiquidPool(params.tokenIn, params.tokenOut);
        (bool zeroForOne, uint160 sqrtPriceLimitX96) = getZeroOneAndSqrtPriceLimitX96(params.tokenIn, params.tokenOut);
        (int256 amount0, int256 amount1) = IUniV3Pool(pool).swap(
            address(this),
            zeroForOne,
            int256(params.amountIn),
            sqrtPriceLimitX96,
            callbackData
        );
        return zeroForOne ? uint256(-amount1) : uint256(-amount0);
    }

    function getQuoteForMostLiquidPool(QParams memory params) internal view returns (uint256 quote) {
        address mostLiquidPool = getMostLiquidPool(params.tokenIn, params.tokenOut);
        if (mostLiquidPool != address(0))
            quote = getQuoteForPool(mostLiquidPool, params);
    }

    function getMostLiquidPool(address token0, address token1) internal view virtual returns (address mostLiquid);

    function getQuoteForPool(address pool, QParams memory params) internal view returns (uint256) {
        (bool zeroForOne, uint160 priceLimit) = getZeroOneAndSqrtPriceLimitX96(params.tokenIn, params.tokenOut);
        (int256 amount0, int256 amount1) = IUniV3Quoter(QUOTER).quote(pool, zeroForOne, params.amountIn, priceLimit);
        return zeroForOne ? uint256(-amount1) : uint256(-amount0);
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
