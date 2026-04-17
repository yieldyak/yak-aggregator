// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.0;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../../../src/adapters/OrqAdapter.sol";

// forge script script/deploy/avalanche/DeployOrqAdapter.s.sol:DeployOrqAdapter --account deployer --rpc-url avalanche --broadcast --skip-simulation -vvvv --verify --verifier-url 'https://api.routescan.io/v2/network/avalanche/evm/43114/etherscan' --etherscan-api-key "verifyContract"

contract DeployOrqAdapter is Script {
    function run() external {
        vm.startBroadcast();

        string memory name = "OrqAdapter";
        address orqFactory = 0xab27768782924B57d39b3E42E19556DE333f3f80;
        uint256 gasEstimate = 120_000;

        OrqAdapter adapter = new OrqAdapter(name, orqFactory, gasEstimate);

        console.log("OrqAdapter deployed at:", address(adapter));
        console.log("Name:", adapter.name());
        console.log("Gas estimate:", adapter.swapGasEstimate());

        vm.stopBroadcast();
    }
}
