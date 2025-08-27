// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.0;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../../../src/adapters/PangolinV3Adapter.sol";

// forge script script/deploy/avalanche/DeployPangolinV3Adapter.s.sol:DeployPangolinV3Adapter --account deployer --rpc-url avalanche --broadcast --skip-simulation -vvvv --verify --verifier-url 'https://api.routescan.io/v2/network/avalanche/evm/43114/etherscan' --etherscan-api-key "verifyContract"

contract DeployPangolinV3Adapter is Script {
    function run() external {
        vm.startBroadcast();

        // Deployment parameters
        string memory name = "PangolinV3Adapter";
        address pangolinFactory = 0x1128F23D0bc0A8396E9FBC3c0c68f5EA228B8256;
        address pangolinQuoter = 0xD2Cb7571AD74Fc59c757a682B3dC503dCc256AAB;
        uint256 gasEstimate = 185_000;
        uint24[] memory defaultFees = new uint24[](4);
        defaultFees[0] = 100;
        defaultFees[1] = 500;
        defaultFees[2] = 2500;
        defaultFees[3] = 8000;

        // Deploy the adapter
        PangolinV3Adapter adapter =
            new PangolinV3Adapter(name, gasEstimate, 500_000, pangolinQuoter, pangolinFactory, defaultFees);

        console.log("PangolinV3Adapter deployed at:", address(adapter));
        console.log("Name:", adapter.name());
        console.log("Gas estimate:", adapter.swapGasEstimate());

        vm.stopBroadcast();
    }
}
