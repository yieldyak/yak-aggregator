// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.0;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../../../src/adapters/PharLegacyAdapter.sol";

// forge script script/deploy/avalanche/DeployPharLegacyAdapter.s.sol:DeployPharLegacyAdapter --account deployer --rpc-url avalanche --broadcast --skip-simulation -vvvv --verify --verifier-url 'https://api.routescan.io/v2/network/avalanche/evm/43114/etherscan' --etherscan-api-key "verifyContract"

contract DeployPharLegacyAdapter is Script {
    function run() external {
        vm.startBroadcast();

        // Deployment parameters
        string memory name = "PharLegacyAdapter";
        address pharaohFactory = 0x85448bF2F589ab1F56225DF5167c63f57758f8c1;
        uint256 gasEstimate = 180_000;

        // Deploy the adapter
        PharLegacyAdapter adapter = new PharLegacyAdapter(name, pharaohFactory, gasEstimate);

        console.log("PharLegacyAdapter deployed at:", address(adapter));
        console.log("Name:", adapter.name());
        console.log("Gas estimate:", adapter.swapGasEstimate());

        vm.stopBroadcast();
    }
}
