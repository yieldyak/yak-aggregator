// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../../deployments/utils/DeploymentFactory.sol";
import {YakRouter} from "../../src/YakRouter.sol";
import {IAdapter} from "../../src/interface/IAdapter.sol";

/**
 * @title UpdateAdapters
 * @notice Admin script to sync router adapters with whitelisted adapters from deployments config
 *
 * @dev This script compares the current on-chain adapters in the YakRouter with the
 *      whitelisted adapters defined in the network deployment config (e.g., AvalancheDeployments.sol).
 *      If they don't match, it shows the differences and can update the router.
 *
 * USAGE:
 * ======
 *
 * 1. CHECK MODE (dry-run):
 *    forge script script/admin/UpdateAdapters.s.sol --account deployer --rpc-url avalanche
 *
 *    This will:
 *    - Show current on-chain adapters
 *    - Show whitelisted adapters from config
 *    - Display differences if any
 *    - NOT make any changes
 *
 * 2. UPDATE MODE (execute):
 *    forge script script/admin/UpdateAdapters.s.sol --account deployer --rpc-url avalanche --broadcast
 *
 *    This will:
 *    - Show the same information as check mode
 *    - Actually call setAdapters() on the router if there are differences
 *    - Requires proper permissions (maintainer/owner)
 *
 * REQUIREMENTS:
 * =============
 * - Must have maintainer/owner permissions to call setAdapters()
 * - Router must be deployed and accessible
 * - Network must be supported in DeploymentFactory
 *
 * SAFETY:
 * =======
 * - Always run in check mode first to review changes
 * - Only run with --broadcast when you're ready to execute
 * - Script will revert if you don't have proper permissions
 */
contract UpdateAdapters is Script {
    function run() external {
        DeploymentFactory factory = new DeploymentFactory();

        // Get deployments for current network
        INetworkDeployments deployments = factory.getDeployments();
        YakRouter router = YakRouter(payable(deployments.getRouter()));

        console.log("Network:", deployments.getNetworkName());
        console.log("Router:", deployments.getRouter());
        console.log("=================================");

        // Get current on-chain adapters
        uint256 onChainCount = router.adaptersCount();
        address[] memory onChainAdapters = new address[](onChainCount);

        console.log("Current on-chain adapters (%d):", onChainCount);
        for (uint256 i = 0; i < onChainCount; i++) {
            onChainAdapters[i] = router.ADAPTERS(i);
            console.log("  [%d] %s", i, onChainAdapters[i]);
        }

        console.log("");

        // Get whitelisted adapters from deployments
        address[] memory whitelistedAdapters = deployments.getWhitelistedAdapters();
        console.log("Whitelisted adapters in config (%d):", whitelistedAdapters.length);
        for (uint256 i = 0; i < whitelistedAdapters.length; i++) {
            console.log("  [%d] %s", i, whitelistedAdapters[i]);
        }

        console.log("");

        // Compare the lists
        bool listsMatch = _compareAdapterLists(onChainAdapters, whitelistedAdapters);

        if (listsMatch) {
            console.log("On-chain adapters match whitelisted adapters. No update needed.");
            return;
        }

        console.log("On-chain adapters do not match whitelisted adapters.");
        console.log("");

        // Show differences
        _showDifferences(onChainAdapters, whitelistedAdapters);

        console.log("Updating router adapters...");

        vm.startBroadcast();
        router.setAdapters(whitelistedAdapters);
        vm.stopBroadcast();

        console.log("Router adapters updated successfully!");
    }

    function _compareAdapterLists(address[] memory list1, address[] memory list2) internal pure returns (bool) {
        if (list1.length != list2.length) {
            return false;
        }

        for (uint256 i = 0; i < list1.length; i++) {
            if (list1[i] != list2[i]) {
                return false;
            }
        }

        return true;
    }

    function _showDifferences(address[] memory onChain, address[] memory whitelisted) internal view {
        console.log("DIFFERENCES:");
        console.log("============");

        // Show adapters that are on-chain but not whitelisted
        console.log("On-chain but not whitelisted:");
        bool foundOnChainOnly = false;
        for (uint256 i = 0; i < onChain.length; i++) {
            bool found = false;
            for (uint256 j = 0; j < whitelisted.length; j++) {
                if (onChain[i] == whitelisted[j]) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                string memory adapterName = IAdapter(onChain[i]).name();
                console.log("  - %s (%s)", onChain[i], adapterName);
                foundOnChainOnly = true;
            }
        }
        if (!foundOnChainOnly) {
            console.log("  (none)");
        }

        console.log("");

        // Show adapters that are whitelisted but not on-chain
        console.log("Whitelisted but not on-chain:");
        bool foundWhitelistedOnly = false;
        for (uint256 i = 0; i < whitelisted.length; i++) {
            bool found = false;
            for (uint256 j = 0; j < onChain.length; j++) {
                if (whitelisted[i] == onChain[j]) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                string memory adapterName = IAdapter(whitelisted[i]).name();
                console.log("  - %s (%s)", whitelisted[i], adapterName);
                foundWhitelistedOnly = true;
            }
        }
        if (!foundWhitelistedOnly) {
            console.log("  (none)");
        }
    }
}
