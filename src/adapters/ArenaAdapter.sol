//       ╟╗                                                                      ╔╬
//       ╞╬╬                                                                    ╬╠╬
//      ╔╣╬╬╬                                                                  ╠╠╠╠╦
//     ╬╬╬╬╬╩                                                                  ╘╠╠╠╠╬
//    ║╬╬╬╬╬                                                                    ╘╠╠╠╠╬
//    ╣╬╬╬╬╬╬╬╬╬╬╬╬╬╬╬      ╒╬╬╬╬╬╬╬╜   ╠╠╬╬╬╬╬╬╬         ╠╬╬╬╬╬╬╬    ╬╬╬╬╬╬╬╬╠╠╠╠╠╠╠╠
//    ╙╬╬╬╬╬╬╬╬╬╬╬╬╬╬╬╕    ╬╬╬╬╬╬╬╜   ╣╠╠╬╬╬╬╬╬╬╬        ╠╬╬╬╬╬╬╬   ╬╬╬╬╬╬╬╬╬╠╠╠╠╠╠╠╩
//     ╙╣╬╬╬╬╬╬╬╬╬╬╬╬╬╬  ╔╬╬╬╬╬╬╬    ╔╠╠╠╬╬╬╬╬╬╬╬        ╠╬╬╬╬╬╬╬ ╣╬╬╬╬╬╬╬╬╬╬╬╠╠╠╠╝╙
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
import "../interface/IUniswapV4StaticQuoter.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {IUnlockCallback} from "@uniswap/v4-core/src/interfaces/callback/IUnlockCallback.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {PoolId, PoolIdLibrary} from "@uniswap/v4-core/src/types/PoolId.sol";
import {Currency} from "@uniswap/v4-core/src/types/Currency.sol";
import {IHooks} from "@uniswap/v4-core/src/interfaces/IHooks.sol";
import {StateLibrary} from "@uniswap/v4-core/src/libraries/StateLibrary.sol";
import {BalanceDelta} from "@uniswap/v4-core/src/types/BalanceDelta.sol";
import {BalanceDeltaLibrary} from "@uniswap/v4-core/src/types/BalanceDelta.sol";
import {TickMath} from "@uniswap/v4-core/src/libraries/TickMath.sol";
import {CurrencyLibrary} from "@uniswap/v4-core/src/types/Currency.sol";
import {TransientStateLibrary} from "@uniswap/v4-core/src/libraries/TransientStateLibrary.sol";

interface IArenaFeeHelperMinimal {
    function getTotalFeePpm(PoolId poolId) external view returns (uint256);
}

interface IArenaHook {
    function arenaFeeHelper() external view returns (address);
}

contract ArenaAdapter is YakAdapter, IUnlockCallback {
    using SafeERC20 for IERC20;
    using PoolIdLibrary for PoolKey;
    using BalanceDeltaLibrary for BalanceDelta;
    using CurrencyLibrary for Currency;

    IPoolManager public immutable poolManager;
    IUniswapV4StaticQuoter public immutable staticQuoter;
    IArenaFeeHelperMinimal public immutable arenaFeeHelper;

    uint24 public immutable feeTier;
    int24 public immutable tickSpacing;
    IHooks public immutable hook;

    uint256 private constant PPM_DENOMINATOR = 1000000; // Parts per million: 1000000 = 100%
    address private constant WAVAX = 0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7;
    address private constant ARENA = 0xB8d7710f7d8349A506b75dD184F05777c82dAd0C;

    constructor(
        string memory _name,
        uint256 _swapGasEstimate,
        address _staticQuoter,
        address _poolManager,
        uint24 _feeTier,
        int24 _tickSpacing,
        address _hook
    ) YakAdapter(_name, _swapGasEstimate) {
        staticQuoter = IUniswapV4StaticQuoter(_staticQuoter);
        poolManager = IPoolManager(_poolManager);
        feeTier = _feeTier;
        tickSpacing = _tickSpacing;
        hook = IHooks(_hook);
        arenaFeeHelper = IArenaFeeHelperMinimal(IArenaHook(_hook).arenaFeeHelper());
    }

    function findBestPool(address token0, address token1)
        public
        view
        returns (PoolKey memory poolKey, uint128 liquidity)
    {
        if (token0 > token1) {
            (token0, token1) = (token1, token0);
        }

        Currency currency0 = Currency.wrap(token0);
        Currency currency1 = Currency.wrap(token1);

        poolKey =
            PoolKey({currency0: currency0, currency1: currency1, fee: feeTier, tickSpacing: tickSpacing, hooks: hook});

        (, liquidity) = getPoolInfo(poolKey);
    }

    function getPoolInfo(PoolKey memory poolKey) internal view returns (bool exists, uint128 liquidity) {
        PoolId poolId = poolKey.toId();
        (uint160 sqrtPriceX96,,,) = StateLibrary.getSlot0(poolManager, poolId);

        // Pool exists if sqrtPriceX96 is non-zero
        exists = sqrtPriceX96 != 0;
        if (exists) {
            liquidity = StateLibrary.getLiquidity(poolManager, poolId);
        }
    }

    function _query(uint256 _amountIn, address _tokenIn, address _tokenOut)
        internal
        view
        override
        returns (uint256 amountOut)
    {
        if (_tokenIn == address(0) || _tokenOut == address(0)) {
            return 0;
        }

        if (_tokenIn != WAVAX && _tokenIn != ARENA && _tokenOut != WAVAX && _tokenOut != ARENA) {
            return 0;
        }

        (PoolKey memory poolKey, uint128 liquidity) = findBestPool(_tokenIn, _tokenOut);

        if (liquidity == 0) {
            return 0;
        }

        address token0 = Currency.unwrap(poolKey.currency0);
        bool zeroForOne = token0 == _tokenIn;

        IUniswapV4StaticQuoter.QuoteExactInputSingleParams memory params =
            IUniswapV4StaticQuoter.QuoteExactInputSingleParams({
                poolKey: poolKey,
                zeroForOne: zeroForOne,
                amountIn: uint128(_amountIn),
                sqrtPriceLimitX96: 0,
                hookData: ""
            });

        try staticQuoter.quoteExactInputSingle(params) returns (uint256 quote) {
            // Adjust for hook fee - static quoter doesn't account for hook fees
            uint256 hookFeePpm = arenaFeeHelper.getTotalFeePpm(poolKey.toId());

            if (hookFeePpm > 0 && hookFeePpm < PPM_DENOMINATOR) {
                return (quote * (PPM_DENOMINATOR - hookFeePpm)) / PPM_DENOMINATOR;
            }
            return quote;
        } catch {
            return 0;
        }
    }

    /// @notice Execute a swap
    function _swap(uint256 _amountIn, uint256 _amountOut, address _tokenIn, address _tokenOut, address _to)
        internal
        override
    {
        (PoolKey memory poolKey, uint128 bestLiquidity) = findBestPool(_tokenIn, _tokenOut);

        require(bestLiquidity > 0, "Pool does not exist");

        bool zeroForOne = Currency.unwrap(poolKey.currency0) == _tokenIn;

        poolManager.sync(Currency.wrap(_tokenIn));

        IERC20(_tokenIn).safeTransfer(address(poolManager), _amountIn);

        bytes memory unlockData =
            abi.encode(poolKey, zeroForOne, -int256(_amountIn), _tokenIn, _tokenOut, _to, _amountOut);

        poolManager.unlock(unlockData);
    }

    function unlockCallback(bytes calldata data) external returns (bytes memory) {
        require(msg.sender == address(poolManager), "Only PoolManager");

        (
            PoolKey memory poolKey,
            bool zeroForOne,
            int256 amountSpecified,,
            address tokenOut,
            address recipient,
            uint256 minAmountOut
        ) = abi.decode(data, (PoolKey, bool, int256, address, address, address, uint256));

        Currency currencyOut = Currency.wrap(tokenOut);

        BalanceDelta delta = poolManager.swap(
            poolKey,
            IPoolManager.SwapParams({
                zeroForOne: zeroForOne,
                amountSpecified: amountSpecified,
                sqrtPriceLimitX96: zeroForOne ? TickMath.MIN_SQRT_PRICE + 1 : TickMath.MAX_SQRT_PRICE - 1
            }),
            ""
        );

        int128 amountInDelta = zeroForOne ? delta.amount0() : delta.amount1();
        int128 amountOutDelta = zeroForOne ? delta.amount1() : delta.amount0();

        require(amountInDelta < 0, "Invalid input delta");
        require(amountOutDelta > 0, "No output delta");

        uint256 amountOutActual = uint256(int256(amountOutDelta));

        require(amountOutActual >= minAmountOut, "Insufficient output");

        poolManager.settle();

        poolManager.take(currencyOut, recipient, amountOutActual);

        return "";
    }
}

