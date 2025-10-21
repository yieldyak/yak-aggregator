// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.0;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../../../src/adapters/PharAdapter.sol";

// forge script script/deploy/avalanche/DeployPharCLAdapter.s.sol:DeployPharCLAdapter --account deployer --rpc-url avalanche --broadcast --skip-simulation -vvvv --verify --verifier-url 'https://api.routescan.io/v2/network/avalanche/evm/43114/etherscan' --etherscan-api-key "verifyContract"

contract DeployPharCLAdapter is Script {
    function run() external {
        vm.startBroadcast();

        // Deployment parameters
        string memory name = "PharCLAdapter";
        address pharFactory = 0xAE6E5c62328ade73ceefD42228528b70c8157D0d;
        address pharQuoter = 0x765FEbfe414A22c67fB0F64Fa540E74072E3793c;
        uint256 gasEstimate = 150_000;
        int24[] memory defaultFees = new int24[](6);
        defaultFees[0] = 1;
        defaultFees[1] = 5;
        defaultFees[2] = 10;
        defaultFees[3] = 50;
        defaultFees[4] = 100;
        defaultFees[5] = 200;

        // Deploy the adapter
        PharAdapter adapter = new PharAdapter(name, gasEstimate, 120_000, pharQuoter, pharFactory, defaultFees);

        console.log("PharCLAdapter deployed at:", address(adapter));
        console.log("Name:", adapter.name());
        console.log("Gas estimate:", adapter.swapGasEstimate());

        vm.stopBroadcast();
    }
}
