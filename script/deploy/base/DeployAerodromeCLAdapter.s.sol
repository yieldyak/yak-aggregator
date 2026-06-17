// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.0;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../../../src/adapters/AerodromeCLAdapter.sol";

// forge script script/deploy/base/DeployAerodromeCLAdapter.s.sol:DeployAerodromeCLAdapter --account deployer --rpc-url base --broadcast --skip-simulation -vvvv --verify --retries 20 --delay 15 --etherscan-api-key "$ETHERSCAN_API_KEY"

contract DeployAerodromeCLAdapter is Script {
    function run() external {
        vm.startBroadcast();

        // Deployment parameters
        string memory name = "AerodromeCLAdapter";
        address staticQuoter = 0xCcbe0b63149Ac6546ce74d21953D3687c7502253;
        address aerodromeCLFactory = 0x5e7BB104d84c7CB9B682AaC2F3d509f5F406809A;
        uint256 gasEstimate = 180_000;

        // Deploy the adapter
        AerodromeCLAdapter adapter = new AerodromeCLAdapter(name, gasEstimate, staticQuoter, aerodromeCLFactory);

        console.log("AerodromeCLAdapter deployed at:", address(adapter));
        console.log("Name:", adapter.name());
        console.log("Gas estimate:", adapter.swapGasEstimate());
        console.log("Static Quoter:", address(adapter.staticQuoter()));
        console.log("Factory:", adapter.FACTORY());

        vm.stopBroadcast();
    }
}

