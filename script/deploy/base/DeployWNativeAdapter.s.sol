// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.0;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../../../src/adapters/WNativeAdapter.sol";

// forge script script/deploy/base/DeployWNativeAdapter.s.sol:DeployWNativeAdapter --account deployer --rpc-url base --broadcast -vvvv --verify --retries 20 --delay 15 --etherscan-api-key "$ETHERSCAN_API_KEY"

contract DeployWNativeAdapter is Script {
    function run() external {
        vm.startBroadcast();

        // Deployment parameters
        string memory name = "WETHAdapter";
        address weth = 0x4200000000000000000000000000000000000006;
        uint256 gasEstimate = 50_000;

        // Deploy the adapter
        WNativeAdapter adapter = new WNativeAdapter(name, weth, gasEstimate);

        console.log("WNativeAdapter deployed at:", address(adapter));
        console.log("Name:", adapter.name());
        console.log("Gas estimate:", adapter.swapGasEstimate());

        vm.stopBroadcast();
    }
}
