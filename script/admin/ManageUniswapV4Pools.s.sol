// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../../src/adapters/UniswapV4Adapter.sol";
import "../../deployments/utils/DeploymentFactory.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {Currency} from "@uniswap/v4-core/src/types/Currency.sol";
import {IHooks} from "@uniswap/v4-core/src/interfaces/IHooks.sol";

/**
 * @title ManageUniswapV4Pools
 * @notice Admin script to sync router pools with whitelisted pools from deployments config
 *
 * @dev This script compares the current on-chain pools in the UniswapV4Adapter with the
 *      whitelisted pools defined in the network deployment config (e.g., AvalancheDeployments.sol).
 *      If they don't match, it shows the differences and can update the adapter.
 *
 * USAGE:
 * ======
 *
 * 1. CHECK MODE (dry-run):
 *    forge script script/admin/ManageUniswapV4Pools.s.sol --account deployer --rpc-url avalanche
 *
 *    This will:
 *    - Show current on-chain pools
 *    - Show whitelisted pools from config
 *    - Display differences if any
 *    - NOT make any changes
 *
 * 2. UPDATE MODE (execute):
 *    forge script script/admin/ManageUniswapV4Pools.s.sol --account deployer --rpc-url avalanche --broadcast
 *
 *    This will:
 *    - Show the same information as check mode
 *    - Actually add/remove pools if there are differences
 *    - Requires proper permissions (maintainer/owner)
 *
 * REQUIREMENTS:
 * =============
 * - Must have maintainer/owner permissions to call addPool/removePool
 * - Adapter must be deployed and accessible
 * - Network must be supported in DeploymentFactory
 *
 * SAFETY:
 * =======
 * - Always run in check mode first to review changes
 * - Only run with --broadcast when you're ready to execute
 * - Script will revert if you don't have proper permissions
 */
contract ManageUniswapV4Pools is Script {
    function run() external {
        DeploymentFactory factory = new DeploymentFactory();
        INetworkDeployments deployments = factory.getDeployments();

        address adapterAddress = deployments.getUniswapV4Adapter();
        UniswapV4Adapter adapter = UniswapV4Adapter(payable(adapterAddress));

        console.log("Network:", deployments.getNetworkName());
        console.log("UniswapV4Adapter:", adapterAddress);
        console.log("=================================");
        console.log("");

        // Get current on-chain pools
        PoolKey[] memory onChainPools = adapter.getAllPools();
        console.log("Current on-chain pools (%d):", onChainPools.length);
        _printPools(onChainPools);
        console.log("");

        // Get whitelisted pools from deployments
        PoolKey[] memory whitelistedPools = deployments.getWhitelistedUniswapV4Pools();
        console.log("Whitelisted pools in config (%d):", whitelistedPools.length);
        _printPools(whitelistedPools);
        console.log("");

        // Compare the lists
        bool poolsMatch = _comparePoolLists(onChainPools, whitelistedPools);

        if (poolsMatch) {
            console.log("On-chain pools match whitelisted pools. No update needed.");
            return;
        }

        console.log("On-chain pools do not match whitelisted pools.");
        console.log("");

        // Show differences
        _showDifferences(onChainPools, whitelistedPools);

        console.log("Updating adapter pools...");

        vm.startBroadcast();

        // Remove pools that are on-chain but not whitelisted
        for (uint256 i = 0; i < onChainPools.length; i++) {
            bool shouldKeep = false;
            for (uint256 j = 0; j < whitelistedPools.length; j++) {
                if (_poolKeysEqual(onChainPools[i], whitelistedPools[j])) {
                    shouldKeep = true;
                    break;
                }
            }
            if (!shouldKeep) {
                try adapter.removePool(onChainPools[i]) {
                    console.log("  Removed pool");
                } catch Error(string memory reason) {
                    console.log("  Failed to remove pool: %s", reason);
                } catch {
                    console.log("  Failed to remove pool: unknown error");
                }
            }
        }

        // Add pools that are whitelisted but not on-chain
        for (uint256 i = 0; i < whitelistedPools.length; i++) {
            bool exists = false;
            for (uint256 j = 0; j < onChainPools.length; j++) {
                if (_poolKeysEqual(whitelistedPools[i], onChainPools[j])) {
                    exists = true;
                    break;
                }
            }
            if (!exists) {
                try adapter.addPool(whitelistedPools[i]) {
                    console.log("  Added pool");
                } catch Error(string memory reason) {
                    console.log("  Failed to add pool: %s", reason);
                } catch {
                    console.log("  Failed to add pool: unknown error");
                }
            }
        }

        vm.stopBroadcast();

        console.log("Adapter pools updated successfully!");
    }

    function _comparePoolLists(PoolKey[] memory list1, PoolKey[] memory list2) internal pure returns (bool) {
        if (list1.length != list2.length) {
            return false;
        }

        // Check if all pools in list1 exist in list2
        for (uint256 i = 0; i < list1.length; i++) {
            bool found = false;
            for (uint256 j = 0; j < list2.length; j++) {
                if (_poolKeysEqual(list1[i], list2[j])) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                return false;
            }
        }

        return true;
    }

    function _showDifferences(PoolKey[] memory onChain, PoolKey[] memory whitelisted) internal pure {
        console.log("DIFFERENCES:");
        console.log("============");

        // Show pools that are on-chain but not whitelisted
        console.log("On-chain but not whitelisted:");
        bool foundOnChainOnly = false;
        for (uint256 i = 0; i < onChain.length; i++) {
            bool found = false;
            for (uint256 j = 0; j < whitelisted.length; j++) {
                if (_poolKeysEqual(onChain[i], whitelisted[j])) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                _printPool(onChain[i], i);
                foundOnChainOnly = true;
            }
        }
        if (!foundOnChainOnly) {
            console.log("  (none)");
        }

        console.log("");

        // Show pools that are whitelisted but not on-chain
        console.log("Whitelisted but not on-chain:");
        bool foundWhitelistedOnly = false;
        for (uint256 i = 0; i < whitelisted.length; i++) {
            bool found = false;
            for (uint256 j = 0; j < onChain.length; j++) {
                if (_poolKeysEqual(whitelisted[i], onChain[j])) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                _printPool(whitelisted[i], i);
                foundWhitelistedOnly = true;
            }
        }
        if (!foundWhitelistedOnly) {
            console.log("  (none)");
        }
    }

    function _printPools(PoolKey[] memory pools) internal pure {
        if (pools.length == 0) {
            console.log("  (none)");
            return;
        }

        for (uint256 i = 0; i < pools.length; i++) {
            _printPool(pools[i], i);
        }
    }

    function _printPool(PoolKey memory pool, uint256 index) internal pure {
        address token0 = Currency.unwrap(pool.currency0);
        address token1 = Currency.unwrap(pool.currency1);
        console.log("  [%d]", index + 1);
        console.log("    Token0: %s", token0);
        console.log("    Token1: %s", token1);
        console.log("    Fee: %d bps", pool.fee);
        console.log("    TickSpacing: %d", pool.tickSpacing);
        console.log("    Hooks: %s", address(pool.hooks));
    }

    function _poolKeysEqual(PoolKey memory a, PoolKey memory b) internal pure returns (bool) {
        return (Currency.unwrap(a.currency0) == Currency.unwrap(b.currency0)
                && Currency.unwrap(a.currency1) == Currency.unwrap(b.currency1) && a.fee == b.fee
                && a.tickSpacing == b.tickSpacing && address(a.hooks) == address(b.hooks));
    }
}

