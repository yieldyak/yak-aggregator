// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {DeploymentFactory} from "../../deployments/utils/DeploymentFactory.sol";
import {YakRouter} from "../../src/YakRouter.sol";
import {IAdapter} from "../../src/interface/IAdapter.sol";

/**
 * @title ListAdapters
 * @notice Admin script to list all adapters currently registered in the YakRouter
 *
 * @dev This script queries the YakRouter contract to display all currently registered
 *      adapters with their addresses and names. It provides a quick overview of the
 *      router's current configuration.
 *
 * USAGE:
 * ======
 *
 * List adapters on any supported network:
 * forge script script/admin/ListAdapters.s.sol --rpc-url <network>
 *
 * Examples:
 * - forge script script/admin/ListAdapters.s.sol --rpc-url avalanche
 * - forge script script/admin/ListAdapters.s.sol --rpc-url arbitrum
 * - forge script script/admin/ListAdapters.s.sol --rpc-url optimism
 *
 */
contract ListAdapters is Script {
    function run() external {
        DeploymentFactory factory = new DeploymentFactory();

        // Get deployments for current network
        INetworkDeployments deployments = factory.getDeployments();

        console.log("Network:", deployments.getNetworkName());
        console.log("Chain ID:", deployments.getChainId());
        console.log("YakRouter:", deployments.getRouter());
        console.log("");

        // Verify router is deployed
        if (deployments.getRouter() == address(0)) {
            console.log("Error: Router address is not set for this network");
            return;
        }

        YakRouter yakRouter = YakRouter(payable(deployments.getRouter()));
        uint256 adapterCount = yakRouter.adaptersCount();
        console.log("Total adapters:", adapterCount);
        console.log("");

        if (adapterCount == 0) {
            console.log("No adapters found in router");
            return;
        }

        // List all adapters
        for (uint256 i = 0; i < adapterCount; i++) {
            address adapterAddr = yakRouter.ADAPTERS(i);

            // Try to get adapter name, but handle failures gracefully
            string memory adapterName = IAdapter(adapterAddr).name();
            console.log("[%d] %s - %s", i, adapterAddr, adapterName);
        }
    }
}
