// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.0;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../../../src/adapters/BlackholeAdapter.sol";

// forge script script/deploy/avalanche/DeployBlackholeAdapter.s.sol:DeployBlackholeAdapter --account deployer --rpc-url avalanche --broadcast --skip-simulation -vvvv --verify --verifier-url 'https://api.routescan.io/v2/network/avalanche/evm/43114/etherscan' --etherscan-api-key "verifyContract"

contract DeployBlackholeAdapter is Script {
    function run() external {
        vm.startBroadcast();

        // Deployment parameters
        string memory name = "BlackholeAdapter";
        address blackholeFactory = 0xfE926062Fb99CA5653080d6C14fE945Ad68c265C;
        uint256 gasEstimate = 180_000;

        // Deploy the adapter
        BlackholeAdapter adapter = new BlackholeAdapter(name, blackholeFactory, gasEstimate);

        console.log("BlackholeAdapter deployed at:", address(adapter));
        console.log("Name:", adapter.name());
        console.log("Gas estimate:", adapter.swapGasEstimate());

        vm.stopBroadcast();
    }
}
