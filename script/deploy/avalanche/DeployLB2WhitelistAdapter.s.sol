// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.0;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../../../src/adapters/LB2WhitelistAdapter.sol";

// forge script script/deploy/avalanche/DeployLB2WhitelistAdapter.s.sol:DeployLB2WhitelistAdapter --account deployer --rpc-url avalanche --broadcast --skip-simulation -vvvv --verify --verifier-url 'https://api.routescan.io/v2/network/avalanche/evm/43114/etherscan' --etherscan-api-key "verifyContract"
//
// After deployment, pairs can be added to the whitelist using adapter.addWhitelistedPair(address)
// or adapter.addWhitelistedPairs(address[])

contract DeployLB2WhitelistAdapter is Script {
    function run() external {
        vm.startBroadcast();

        // Deployment parameters
        string memory name = "LB2WhitelistAdapter";
        uint256 swapGasEstimate = 350_000;
        uint256 quoteGasLimit = 600_000;

        // Initial whitelisted pairs (can be empty, pairs added later)
        address[] memory initialPairs = new address[](5);
        initialPairs[0] = 0x2f1DA4bafd5f2508EC2e2E425036063A374993B6;
        initialPairs[1] = 0x87EB2F90d7D0034571f343fb7429AE22C1Bd9F72;
        initialPairs[2] = 0xE2B11d3002A2e49F1005e212e860f3b3eC73F985;
        initialPairs[3] = 0x9B2Cc8E6a2Bbb56d6bE4682891a91B0e48633c72;
        initialPairs[4] = 0x4224f6F4C9280509724Db2DbAc314621e4465C29;

        // Deploy the adapter
        LB2WhitelistAdapter adapter = new LB2WhitelistAdapter(name, swapGasEstimate, quoteGasLimit, initialPairs);

        console.log("LB2WhitelistAdapter deployed at:", address(adapter));
        console.log("Name:", adapter.name());
        console.log("Swap gas estimate:", adapter.swapGasEstimate());
        console.log("Quote gas limit:", adapter.quoteGasLimit());
        console.log("");

        vm.stopBroadcast();
    }
}
