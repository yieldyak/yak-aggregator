// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.0;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../../../src/adapters/PancakeV3Adapter.sol";

// forge script script/deploy/base/DeployPancakeV3Adapter.s.sol:DeployPancakeV3Adapter --account deployer --rpc-url base --broadcast -vvvv --verify --retries 20 --delay 15 --etherscan-api-key "$ETHERSCAN_API_KEY"

contract DeployPancakeV3Adapter is Script {
    function run() external {
        vm.startBroadcast();

        // Deployment parameters
        string memory name = "PancakeV3Adapter";
        address pancakeV3Factory = 0x0BFbCF9fa4f9C56B0F40a671Ad40E0805A091865;
        address quoter = 0xa7390d5e8508Fab8eB40A94A6af0D5be5e76aCcb;
        uint256 gasEstimate = 185_000;
        uint256 quoterGasLimit = 500_000;
        uint24[] memory defaultFees = new uint24[](4);
        defaultFees[0] = 100;
        defaultFees[1] = 500;
        defaultFees[2] = 2500;
        defaultFees[3] = 10000;

        // Deploy the adapter
        PancakeV3Adapter adapter =
            new PancakeV3Adapter(name, gasEstimate, quoterGasLimit, quoter, pancakeV3Factory, defaultFees);

        console.log("PancakeV3Adapter deployed at:", address(adapter));
        console.log("Name:", adapter.name());
        console.log("Gas estimate:", adapter.swapGasEstimate());
        console.log("Quoter:", adapter.quoter());
        console.log("Quoter gas limit:", adapter.quoterGasLimit());

        vm.stopBroadcast();
    }
}
