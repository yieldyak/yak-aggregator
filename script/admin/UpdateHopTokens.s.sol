// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../../deployments/utils/DeploymentFactory.sol";
import {YakRouter} from "../../src/YakRouter.sol";

// Simple interface for getting token symbols
interface IERC20Symbol {
    function symbol() external view returns (string memory);
}

/**
 * @title UpdateHopTokens
 * @notice Admin script to sync router hop tokens (trusted tokens) with whitelisted hop tokens from deployments config
 *
 * @dev This script compares the current on-chain trusted tokens in the YakRouter with the
 *      whitelisted hop tokens defined in the network deployment config (e.g., AvalancheDeployments.sol).
 *      If they don't match, it shows the differences and can update the router.
 *
 * USAGE:
 * ======
 *
 * 1. CHECK MODE (dry-run):
 *    forge script script/admin/UpdateHopTokens.s.sol --account deployer --rpc-url avalanche
 *
 *    This will:
 *    - Show current on-chain trusted tokens
 *    - Show whitelisted hop tokens from config
 *    - Display differences if any
 *    - NOT make any changes
 *
 * 2. UPDATE MODE (execute):
 *    forge script script/admin/UpdateHopTokens.s.sol --account deployer --rpc-url avalanche --broadcast
 *
 *    This will:
 *    - Show the same information as check mode
 *    - Actually call setTrustedTokens() on the router if there are differences
 *    - Requires proper permissions (maintainer/owner)
 *
 * REQUIREMENTS:
 * =============
 * - Must have maintainer/owner permissions to call setTrustedTokens()
 * - Router must be deployed and accessible
 * - Network must be supported in DeploymentFactory
 *
 * SAFETY:
 * =======
 * - Always run in check mode first to review changes
 * - Only run with --broadcast when you're ready to execute
 * - Script will revert if you don't have proper permissions
 */
contract UpdateHopTokens is Script {
    function run() external {
        DeploymentFactory factory = new DeploymentFactory();

        // Get deployments for current network
        INetworkDeployments deployments = factory.getDeployments();
        YakRouter router = YakRouter(payable(deployments.getRouter()));

        console.log("Network:", deployments.getNetworkName());
        console.log("Router:", deployments.getRouter());
        console.log("=================================");

        // Get current on-chain trusted tokens
        uint256 onChainCount = router.trustedTokensCount();
        address[] memory onChainTokens = new address[](onChainCount);

        console.log("Current on-chain trusted tokens (%d):", onChainCount);
        for (uint256 i = 0; i < onChainCount; i++) {
            onChainTokens[i] = router.TRUSTED_TOKENS(i);
            string memory tokenSymbol = _getTokenSymbol(onChainTokens[i]);
            console.log("  [%d] %s (%s)", i, onChainTokens[i], tokenSymbol);
        }

        console.log("");

        // Get whitelisted hop tokens from deployments
        address[] memory whitelistedTokens = deployments.getWhitelistedHopTokens();
        console.log("Whitelisted hop tokens in config (%d):", whitelistedTokens.length);
        for (uint256 i = 0; i < whitelistedTokens.length; i++) {
            string memory tokenSymbol = _getTokenSymbol(whitelistedTokens[i]);
            console.log("  [%d] %s (%s)", i, whitelistedTokens[i], tokenSymbol);
        }

        console.log("");

        // Compare the lists
        bool listsMatch = _compareTokenLists(onChainTokens, whitelistedTokens);

        if (listsMatch) {
            console.log("On-chain trusted tokens match whitelisted hop tokens. No update needed.");
            return;
        }

        console.log("On-chain trusted tokens do not match whitelisted hop tokens.");
        console.log("");

        // Show differences
        _showDifferences(onChainTokens, whitelistedTokens);

        console.log("Updating router trusted tokens...");

        vm.startBroadcast();
        router.setTrustedTokens(whitelistedTokens);
        vm.stopBroadcast();

        console.log("Router trusted tokens updated successfully!");
    }

    function _compareTokenLists(address[] memory list1, address[] memory list2) internal pure returns (bool) {
        if (list1.length != list2.length) {
            return false;
        }

        // Check if all tokens in list1 exist in list2
        for (uint256 i = 0; i < list1.length; i++) {
            bool found = false;
            for (uint256 j = 0; j < list2.length; j++) {
                if (list1[i] == list2[j]) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                return false;
            }
        }

        // Check if all tokens in list2 exist in list1
        for (uint256 i = 0; i < list2.length; i++) {
            bool found = false;
            for (uint256 j = 0; j < list1.length; j++) {
                if (list2[i] == list1[j]) {
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

    function _showDifferences(address[] memory onChain, address[] memory whitelisted) internal view {
        console.log("DIFFERENCES:");
        console.log("============");

        // Show tokens that are on-chain but not whitelisted
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
                string memory tokenSymbol = _getTokenSymbol(onChain[i]);
                console.log("  - %s (%s)", onChain[i], tokenSymbol);
                foundOnChainOnly = true;
            }
        }
        if (!foundOnChainOnly) {
            console.log("  (none)");
        }

        console.log("");

        // Show tokens that are whitelisted but not on-chain
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
                string memory tokenSymbol = _getTokenSymbol(whitelisted[i]);
                console.log("  - %s (%s)", whitelisted[i], tokenSymbol);
                foundWhitelistedOnly = true;
            }
        }
        if (!foundWhitelistedOnly) {
            console.log("  (none)");
        }
    }

    function _getTokenSymbol(address token) internal view returns (string memory) {
        try IERC20Symbol(token).symbol() returns (string memory symbol) {
            return symbol;
        } catch {
            return "UNKNOWN";
        }
    }
}
