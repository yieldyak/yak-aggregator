// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../../src/adapters/UniswapV4Adapter.sol";
import "../../deployments/utils/DeploymentFactory.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {Currency} from "@uniswap/v4-core/src/types/Currency.sol";
import {IHooks} from "@uniswap/v4-core/src/interfaces/IHooks.sol";
import {PoolId, PoolIdLibrary} from "@uniswap/v4-core/src/types/PoolId.sol";
import {StateLibrary} from "@uniswap/v4-core/src/libraries/StateLibrary.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";

/**
 * @title DiscoverUniswapV4Pools
 * @notice Utility script to discover all existing pools for a token pair on Uniswap V4
 *
 * @dev This script queries the pool manager to find all pools that exist for a given
 *      token pair by trying common fee tier and tick spacing combinations.
 *
 * USAGE:
 * ======
 *
 * forge script script/utils/DiscoverUniswapV4Pools.s.sol:DiscoverUniswapV4Pools \
 *   --sig "run(address,address)" <token0> <token1> \
 *   --rpc-url avalanche
 *
 * Example:
 * forge script script/utils/DiscoverUniswapV4Pools.s.sol:DiscoverUniswapV4Pools \
 *   --sig "run(address,address)" \
 *   0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7 \
 *   0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E \
 *   --rpc-url avalanche
 */
contract DiscoverUniswapV4Pools is Script {
    using PoolIdLibrary for PoolKey;

    function run(address token0, address token1) external {
        DeploymentFactory factory = new DeploymentFactory();
        INetworkDeployments deployments = factory.getDeployments();

        address adapterAddress = deployments.getUniswapV4Adapter();
        UniswapV4Adapter adapter = UniswapV4Adapter(payable(adapterAddress));
        IPoolManager poolManager = adapter.poolManager();

        console.log("Network:", deployments.getNetworkName());
        console.log("Pool Manager:", address(poolManager));
        console.log("Token0:", token0);
        console.log("Token1:", token1);
        console.log("=================================");
        console.log("");

        // Sort tokens
        if (token0 > token1) (token0, token1) = (token1, token0);

        // Common fee tiers (in basis points)
        uint24[] memory fees = new uint24[](5);
        fees[0] = 32;
        fees[1] = 100; // 0.01%
        fees[2] = 500; // 0.05%
        fees[3] = 3000; // 0.3%
        fees[4] = 10000; // 1%

        // Common tick spacings
        // Note: In Uniswap V4, tick spacing is decoupled from fee tiers, so we try
        // common values seen in the codebase and Uniswap V3/V4 practice
        int24[] memory tickSpacings = new int24[](4);
        tickSpacings[0] = 1; // Used in tests (very tight, V4 specific)
        tickSpacings[1] = 10; // Used in tests (0.05% fee equivalent from V3)
        tickSpacings[2] = 60; // Most common (0.3% fee equivalent from V3, used in tests)
        tickSpacings[3] = 200; // Used by ArenaAdapter (1% fee equivalent from V3)

        Currency currency0 = Currency.wrap(token0);
        Currency currency1 = Currency.wrap(token1);

        PoolKey[] memory foundPools = new PoolKey[](fees.length * tickSpacings.length);
        uint256 foundCount = 0;

        console.log("Scanning for pools...");
        console.log("");

        // Try all combinations
        for (uint256 i = 0; i < fees.length; i++) {
            for (uint256 j = 0; j < tickSpacings.length; j++) {
                PoolKey memory poolKey = PoolKey({
                    currency0: currency0,
                    currency1: currency1,
                    fee: fees[i],
                    tickSpacing: tickSpacings[j],
                    hooks: IHooks(address(0))
                });

                // Check if pool exists
                (bool exists,) = _checkPoolExists(poolManager, poolKey);
                if (exists) {
                    foundPools[foundCount] = poolKey;
                    foundCount++;
                }
            }
        }

        // Resize array
        PoolKey[] memory finalPools = new PoolKey[](foundCount);
        for (uint256 i = 0; i < foundCount; i++) {
            finalPools[i] = foundPools[i];
        }

        console.log("Found %d pools:", foundCount);
        console.log("");

        if (foundCount == 0) {
            console.log("No pools found for this token pair.");
            return;
        }

        _printPoolsWithDetails(poolManager, finalPools);
    }

    function _checkPoolExists(IPoolManager poolManager, PoolKey memory poolKey)
        internal
        view
        returns (bool exists, uint128 liquidity)
    {
        PoolId poolId = poolKey.toId();
        (uint160 sqrtPriceX96,,,) = StateLibrary.getSlot0(poolManager, poolId);

        // Pool exists if sqrtPriceX96 is non-zero (initialized pools always have a price)
        exists = sqrtPriceX96 != 0;
        if (exists) {
            liquidity = StateLibrary.getLiquidity(poolManager, poolId);
        }
    }

    function _getPoolLiquidity(IPoolManager poolManager, PoolKey memory poolKey)
        internal
        view
        returns (uint128 liquidity)
    {
        PoolId poolId = poolKey.toId();
        liquidity = StateLibrary.getLiquidity(poolManager, poolId);
    }

    function _printPoolsWithDetails(IPoolManager poolManager, PoolKey[] memory pools) internal view {
        for (uint256 i = 0; i < pools.length; i++) {
            address token0 = Currency.unwrap(pools[i].currency0);
            address token1 = Currency.unwrap(pools[i].currency1);
            uint128 liquidity = _getPoolLiquidity(poolManager, pools[i]);

            console.log("  [%d]", i + 1);
            console.log("    Token0: %s", token0);
            console.log("    Token1: %s", token1);
            console.log("    Fee: %d bps", pools[i].fee);
            console.log("    TickSpacing: %d", pools[i].tickSpacing);
            console.log("    Hooks: %s", address(pools[i].hooks));
            console.log("    Liquidity: %d", liquidity);
            console.log("");
        }
    }
}

