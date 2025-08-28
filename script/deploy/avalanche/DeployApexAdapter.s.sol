// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.0;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../../../src/adapters/ApexAdapter.sol";

// forge script script/deploy/avalanche/DeployApexAdapter.s.sol:DeployApexAdapter --account deployer --rpc-url avalanche --broadcast --skip-simulation -vvvv --verify --verifier-url 'https://api.routescan.io/v2/network/avalanche/evm/43114/etherscan' --etherscan-api-key "verifyContract"

contract DeployApexAdapter is Script {
    function run() external {
        vm.startBroadcast();

        // Deployment parameters
        string memory name = "ApexAdapter";
        address apexRouter = 0x5d2dDA02280F55A9D4529eadFA45Ff032928082B;
        address apexFactory = 0x709D667c0f7cb42e6099B1a2b2B71409086315Cc;
        address WAVAX = 0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7;
        uint256 gasEstimate = 150_000;

        // Deploy the adapter
        ApexAdapter adapter = new ApexAdapter(name, apexRouter, apexFactory, gasEstimate, WAVAX);

        console.log("ApexAdapter deployed at:", address(adapter));
        console.log("Name:", adapter.name());
        console.log("Gas estimate:", adapter.swapGasEstimate());

        vm.stopBroadcast();
    }
}
