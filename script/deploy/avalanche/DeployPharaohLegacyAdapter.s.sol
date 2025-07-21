// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.0;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../../../src/adapters/VelodromeAdapter.sol";

// forge script script/deploy/avalanche/DeployPharaohLegacyAdapter.s.sol:DeployPharaohLegacyAdapter --account deployer --rpc-url avalanche --broadcast --skip-simulation -vvvv --verify --verifier-url 'https://api.routescan.io/v2/network/avalanche/evm/43114/etherscan' --etherscan-api-key "verifyContract"

contract DeployPharaohLegacyAdapter is Script {
    function run() external {
        vm.startBroadcast();

        // Deployment parameters
        string memory name = "PharaohLegacyAdapter";
        address pharaohFactory = 0xAAA16c016BF556fcD620328f0759252E29b1AB57;
        uint256 gasEstimate = 185_000;

        // Deploy the adapter
        VelodromeAdapter adapter = new VelodromeAdapter(name, pharaohFactory, gasEstimate);

        console.log("PharaohLegacyAdapter deployed at:", address(adapter));
        console.log("Name:", adapter.name());
        console.log("Gas estimate:", adapter.swapGasEstimate());

        vm.stopBroadcast();
    }
}
