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

import {IERC20} from "../interface/IERC20.sol";
import {SafeERC20} from "../lib/SafeERC20.sol";
import {YakAdapter} from "../YakAdapter.sol";
import {IUniswapV4StaticQuoter} from "../interface/IUniswapV4StaticQuoter.sol";
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
import {EfficientHashLib} from "@solady/utils/EfficientHashLib.sol";
import {IWETH} from "../interface/IWETH.sol";

contract UniswapV4Adapter is YakAdapter, IUnlockCallback {
    using SafeERC20 for IERC20;
    using PoolIdLibrary for PoolKey;
    using BalanceDeltaLibrary for BalanceDelta;
    using CurrencyLibrary for Currency;

    IPoolManager public immutable poolManager;
    IUniswapV4StaticQuoter public immutable staticQuoter;
    address public immutable WNATIVE;

    // token pair -> pools array
    mapping(address => mapping(address => PoolKey[])) internal tokenPairPools; // On-chain lookup
    PoolKey[] public allPools; // Off-chain enumeration

    constructor(
        string memory _name,
        uint256 _swapGasEstimate,
        address _staticQuoter,
        address _poolManager,
        address _wrappedNative
    ) YakAdapter(_name, _swapGasEstimate) {
        staticQuoter = IUniswapV4StaticQuoter(_staticQuoter);
        poolManager = IPoolManager(_poolManager);
        WNATIVE = _wrappedNative;
    }

    function addPool(PoolKey calldata poolKey) external onlyMaintainer {
        // Verify pool exists on-chain before adding
        (bool exists,) = getPoolInfo(poolKey);
        require(exists, "Pool does not exist on-chain");

        address token0 = Currency.unwrap(poolKey.currency0);
        address token1 = Currency.unwrap(poolKey.currency1);

        // Store pool with actual currency addresses
        address storageToken0 = token0;
        address storageToken1 = token1;
        if (storageToken0 > storageToken1) (storageToken0, storageToken1) = (storageToken1, storageToken0);

        PoolKey[] storage pools = tokenPairPools[storageToken0][storageToken1];
        for (uint256 i = 0; i < pools.length; i++) {
            require(!_poolKeysEqual(pools[i], poolKey), "Pool already whitelisted");
        }

        pools.push(poolKey);
        allPools.push(poolKey);
    }

    function removePool(PoolKey calldata poolKey) external onlyMaintainer {
        address token0 = Currency.unwrap(poolKey.currency0);
        address token1 = Currency.unwrap(poolKey.currency1);

        // Use actual currency addresses for lookup
        address storageToken0 = token0;
        address storageToken1 = token1;
        if (storageToken0 > storageToken1) (storageToken0, storageToken1) = (storageToken1, storageToken0);

        PoolKey[] storage pools = tokenPairPools[storageToken0][storageToken1];
        uint256 poolsLength = pools.length;
        for (uint256 i = 0; i < poolsLength; i++) {
            if (_poolKeysEqual(pools[i], poolKey)) {
                pools[i] = pools[poolsLength - 1];
                pools.pop();
                break;
            }
        }

        uint256 allPoolsLength = allPools.length;
        for (uint256 i = 0; i < allPoolsLength; i++) {
            if (_poolKeysEqual(allPools[i], poolKey)) {
                allPools[i] = allPools[allPoolsLength - 1];
                allPools.pop();
                break;
            }
        }
    }

    function getPools(address token0, address token1) external view returns (PoolKey[] memory) {
        return _getPoolsForPair(token0, token1);
    }

    function getAllPools() external view returns (PoolKey[] memory) {
        return allPools;
    }

    function _getPoolsForPair(address token0, address token1) internal view returns (PoolKey[] storage) {
        if (token0 > token1) (token0, token1) = (token1, token0);
        return tokenPairPools[token0][token1];
    }

    function _poolKeysEqual(PoolKey memory a, PoolKey memory b) internal pure returns (bool) {
        return EfficientHashLib.hash(abi.encode(a)) == EfficientHashLib.hash(abi.encode(b));
    }

    function _findBestPool(uint256 amountIn, address tokenIn, address tokenOut)
        internal
        view
        returns (PoolKey memory bestPool, uint256 bestAmountOut)
    {
        // Check pools for the token pair (e.g., WAVAX/USDC pools)
        PoolKey[] storage pools = _getPoolsForPair(tokenIn, tokenOut);
        (bestPool, bestAmountOut) = _tryPools(pools, tokenIn, amountIn, bestPool, bestAmountOut);

        // If router queries with WNATIVE, also check native pools
        // These are different pools and we want to compare quotes from both
        if (tokenIn == WNATIVE || tokenOut == WNATIVE) {
            PoolKey[] storage nativePools =
                _getPoolsForPair(tokenIn == WNATIVE ? address(0) : tokenIn, tokenOut == WNATIVE ? address(0) : tokenOut);
            (bestPool, bestAmountOut) = _tryPools(nativePools, tokenIn, amountIn, bestPool, bestAmountOut);
        }
    }

    function _tryPools(
        PoolKey[] storage pools,
        address tokenIn,
        uint256 amountIn,
        PoolKey memory currentBestPool,
        uint256 currentBestAmountOut
    ) internal view returns (PoolKey memory bestPool, uint256 bestAmountOut) {
        bestPool = currentBestPool;
        bestAmountOut = currentBestAmountOut;

        for (uint256 i = 0; i < pools.length; i++) {
            PoolKey memory poolKey = pools[i];

            address poolToken0 = Currency.unwrap(poolKey.currency0);
            address poolToken1 = Currency.unwrap(poolKey.currency1);

            // Determine which token in the pool matches our input
            // Handle both native (address(0)) and WNATIVE cases
            address actualTokenIn = tokenIn;
            if (tokenIn == WNATIVE && (poolToken0 == address(0) || poolToken1 == address(0))) {
                actualTokenIn = address(0); // Pool uses native, map WNATIVE to native
            }

            bool zeroForOne = poolToken0 == actualTokenIn;

            IUniswapV4StaticQuoter.QuoteExactInputSingleParams memory params =
                IUniswapV4StaticQuoter.QuoteExactInputSingleParams({
                    poolKey: poolKey,
                    zeroForOne: zeroForOne,
                    amountIn: uint128(amountIn),
                    sqrtPriceLimitX96: 0, // Use default (no price limit)
                    hookData: "" // Empty for no-hook pools
                });

            try staticQuoter.quoteExactInputSingle(params) returns (uint256 quote) {
                if (quote > bestAmountOut) {
                    bestPool = poolKey;
                    bestAmountOut = quote;
                }
            } catch {
                continue;
            }
        }
    }

    function getPoolInfo(PoolKey memory poolKey) internal view returns (bool exists, uint128 liquidity) {
        PoolId poolId = poolKey.toId();
        (uint160 sqrtPriceX96,,,) = StateLibrary.getSlot0(poolManager, poolId);

        // Pool exists if sqrtPriceX96 is non-zero (initialized pools always have a price)
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
        (, amountOut) = _findBestPool(_amountIn, _tokenIn, _tokenOut);
    }

    function _swap(uint256 _amountIn, uint256 _amountOut, address _tokenIn, address _tokenOut, address _to)
        internal
        override
    {
        (PoolKey memory poolKey, uint256 bestAmountOut) = _findBestPool(_amountIn, _tokenIn, _tokenOut);

        require(bestAmountOut > 0, "No pool found or invalid quote");

        address poolToken0 = Currency.unwrap(poolKey.currency0);
        address poolToken1 = Currency.unwrap(poolKey.currency1);

        bool poolUsesNativeForInput = (_tokenIn == WNATIVE) && (poolToken0 == address(0) || poolToken1 == address(0));
        address actualTokenIn = poolUsesNativeForInput ? address(0) : _tokenIn;

        if (_tokenIn == WNATIVE && poolUsesNativeForInput) {
            IWETH(WNATIVE).withdraw(_amountIn);
        }

        if (!poolUsesNativeForInput) {
            poolManager.sync(Currency.wrap(actualTokenIn));
            IERC20(_tokenIn).safeTransfer(address(poolManager), _amountIn);
        }

        // Encode swap parameters to pass via unlock callback
        bytes memory unlockData = abi.encode(
            poolKey,
            poolToken0 == actualTokenIn,
            -int256(_amountIn), // Negative for exact input
            _to,
            _amountOut, // Minimum output amount
            poolUsesNativeForInput
        );

        // Execute unlock which triggers unlockCallback where swap, settle, and take happen
        poolManager.unlock(unlockData);
    }

    function unlockCallback(bytes calldata data) external returns (bytes memory) {
        require(msg.sender == address(poolManager), "Only PoolManager");

        (
            PoolKey memory poolKey,
            bool zeroForOne,
            int256 amountSpecified,
            address recipient,
            uint256 minAmountOut,
            bool isNativeIn
        ) = abi.decode(data, (PoolKey, bool, int256, address, uint256, bool));

        // Derive output currency from poolKey
        address tokenOut = zeroForOne ? Currency.unwrap(poolKey.currency1) : Currency.unwrap(poolKey.currency0);

        BalanceDelta delta = poolManager.swap(
            poolKey,
            IPoolManager.SwapParams({
                zeroForOne: zeroForOne,
                amountSpecified: amountSpecified,
                sqrtPriceLimitX96: zeroForOne ? TickMath.MIN_SQRT_PRICE + 1 : TickMath.MAX_SQRT_PRICE - 1
            }),
            ""
        );

        int128 amountOutDelta = zeroForOne ? delta.amount1() : delta.amount0();
        uint256 amountOutActual = uint256(int256(amountOutDelta));
        require(amountOutActual >= minAmountOut, "Insufficient output");

        // Calculate amount owed to pool manager
        int128 amountInDelta = zeroForOne ? delta.amount0() : delta.amount1();
        uint256 amountOwed = uint256(int256(-amountInDelta)); // Negative because we're paying in

        // Settle: pay what we owe
        // For native token input, send native tokens via settle{value: ...}
        // For ERC20 input, settle normally (tokens already transferred)
        if (isNativeIn) {
            // Send native tokens via settle
            require(address(this).balance >= amountOwed, "Insufficient native balance");
            poolManager.settle{value: amountOwed}();
        } else {
            poolManager.settle();
        }

        if (tokenOut == address(0)) {
            poolManager.take(Currency.wrap(tokenOut), address(this), amountOutActual);
            IWETH(WNATIVE).deposit{value: amountOutActual}();
            IERC20(WNATIVE).safeTransfer(recipient, amountOutActual);
        } else {
            poolManager.take(Currency.wrap(tokenOut), recipient, amountOutActual);
        }

        return "";
    }
}

