// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.0;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../../../src/SimpleRouter.sol";

// forge script script/deploy/base/DeploySimpleRouter.s.sol:DeploySimpleRouter --account deployer --rpc-url base --broadcast --skip-simulation -vvvv --verify --retries 20 --delay 15 --etherscan-api-key "$ETHERSCAN_API_KEY"

contract DeploySimpleRouter is Script {
    function run() external {
        vm.startBroadcast();

        // Deployment parameters
        bool yakSwapFallback = true;
        uint256 maxStepsFallback = 3;
        address yakRouter = 0x50564bF9cE3b1eA33c7bDb5acfFb1B997C319aE4;
        uint256 feeBips = 0;
        address feeCollector = vm.envAddress("TEAM_MULTISIG");

        // Deploy the router
        SimpleRouter simpleRouter =
            new SimpleRouter(yakSwapFallback, maxStepsFallback, yakRouter, feeBips, feeCollector);

        console.log("SimpleRouter deployed at:", address(simpleRouter));
        console.log("YakRouter:", address(simpleRouter.yakRouter()));
        console.log("Max steps fallback:", simpleRouter.maxStepsFallback());
        console.log("Fee bips:", simpleRouter.feeBips());
        console.log("Fee collector:", simpleRouter.feeCollector());

        vm.stopBroadcast();
    }
}
