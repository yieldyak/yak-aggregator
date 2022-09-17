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
    function quoteExactInputSingle(
        QParams memory params
    ) external view returns (uint256);

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
    uint256 public quoterGasLimit;
    address public quoter;

    constructor(
        string memory _name,
        uint256 _swapGasEstimate,
        address _quoter,
        uint256 _quoterGasLimit
    ) YakAdapter(_name, _swapGasEstimate) {
        setQuoterGasLimit(_quoterGasLimit);
        setQuoter(_quoter);
    }

    function setQuoter(address newQuoter) public onlyMaintainer {
        quoter = newQuoter;
    }

    function setQuoterGasLimit(uint256 newLimit) public onlyMaintainer {
        require(newLimit != 0, "queryGasLimit can't be zero");
        quoterGasLimit = newLimit;
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
        quote = getQuoteForBestPool(params);
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
        params = QParams({ 
            amountIn: int256(amountIn), 
            tokenIn: tokenIn, 
            tokenOut: tokenOut, 
            fee: 0 
        });
    }

    function _underlyingSwap(
        QParams memory params, 
        bytes memory callbackData
    ) internal virtual returns (uint256) {
        address pool = getBestPool(params.tokenIn, params.tokenOut);
        (bool zeroForOne, uint160 priceLimit) = getZeroOneAndSqrtPriceLimitX96(
            params.tokenIn, 
            params.tokenOut
        );
        (int256 amount0, int256 amount1) = IUniV3Pool(pool).swap(
            address(this),
            zeroForOne,
            int256(params.amountIn),
            priceLimit,
            callbackData
        );
        return zeroForOne ? uint256(-amount1) : uint256(-amount0);
    }

    function getQuoteForBestPool(
        QParams memory params
    ) internal view returns (uint256 quote) {
        address bestPool = getBestPool(params.tokenIn, params.tokenOut);
        if (bestPool != address(0)) quote = getQuoteForPool(bestPool, params);
    }

    function getBestPool(
        address token0, 
        address token1
    ) internal view virtual returns (address mostLiquid);
    
    function getQuoteForPool(
        address pool, 
        QParams memory params
    ) internal view returns (uint256) {
        (bool zeroForOne, uint160 priceLimit) = getZeroOneAndSqrtPriceLimitX96(
            params.tokenIn, 
            params.tokenOut
        );
        (int256 amount0, int256 amount1) = getQuoteSafe(
            pool,
            zeroForOne,
            params.amountIn,
            priceLimit
        );
        return zeroForOne ? uint256(-amount1) : uint256(-amount0);
    }

    function getQuoteSafe(
        address pool, 
        bool zeroForOne,
        int256 amountIn,
        uint160 priceLimit
    ) internal view returns (int256 amount0, int256 amount1) {
        bytes memory calldata_ = abi.encodeWithSignature(
            "quote(address,bool,int256,uint160)",
            pool,
            zeroForOne,
            amountIn,
            priceLimit
        );
        (bool success, bytes memory data) = staticCallQuoterRaw(calldata_);
        if (success)
            (amount0, amount1) = abi.decode(data, (int256, int256));
    }

    function staticCallQuoterRaw(
        bytes memory calldata_
    ) internal view returns (bool success, bytes memory data) {
        (success, data) = quoter.staticcall{gas: quoterGasLimit}(calldata_);
    }

    function getZeroOneAndSqrtPriceLimitX96(address tokenIn, address tokenOut)
        internal
        pure
        returns (bool zeroForOne, uint160 sqrtPriceLimitX96)
    {
        zeroForOne = tokenIn < tokenOut;
        sqrtPriceLimitX96 = zeroForOne ? MIN_SQRT_RATIO+1 : MAX_SQRT_RATIO-1;
    }
}
