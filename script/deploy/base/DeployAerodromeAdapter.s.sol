// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.0;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../../../src/adapters/AerodromeAdapter.sol";

// forge script script/deploy/base/DeployAerodromeAdapter.s.sol:DeployAerodromeAdapter --account deployer --rpc-url base --broadcast --skip-simulation -vvvv --verify --retries 20 --delay 15 --etherscan-api-key "$ETHERSCAN_API_KEY"

contract DeployAerodromeAdapter is Script {
    function run() external {
        vm.startBroadcast();

        // Deployment parameters
        string memory name = "AerodromeAdapter";
        address aerodromeFactory = 0x420DD381b31aEf6683db6B902084cB0FFECe40Da;
        uint256 gasEstimate = 180_000;

        // Deploy the adapter
        AerodromeAdapter adapter = new AerodromeAdapter(name, aerodromeFactory, gasEstimate);

        console.log("AerodromeAdapter deployed at:", address(adapter));
        console.log("Name:", adapter.name());
        console.log("Gas estimate:", adapter.swapGasEstimate());

        vm.stopBroadcast();
    }
}
