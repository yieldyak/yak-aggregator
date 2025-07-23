// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.0;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../../../src/adapters/AlgebraIntegralAdapter.sol";

// forge script script/deploy/avalanche/DeployBlackholeCLAdapter.s.sol:DeployBlackholeCLAdapter --account deployer --rpc-url avalanche --broadcast --skip-simulation -vvvv --verify --verifier-url 'https://api.routescan.io/v2/network/avalanche/evm/43114/etherscan' --etherscan-api-key "verifyContract"

contract DeployBlackholeCLAdapter is Script {
    function run() external {
        vm.startBroadcast();

        // Deployment parameters
        string memory name = "BlackholeCLAdapter";
        address blackholeFactory = 0x512eb749541B7cf294be882D636218c84a5e9E5F;
        address blackholeQuoter = 0x1f424ffae1A36Ee71Fc236eDd7CFD0a486Ea84E0;
        uint256 gasEstimate = 185_000;

        // Deploy the adapter
        AlgebraIntegralAdapter adapter =
            new AlgebraIntegralAdapter(name, gasEstimate, 500_000, blackholeQuoter, blackholeFactory);

        console.log("BlackholeCLAdapter deployed at:", address(adapter));
        console.log("Name:", adapter.name());
        console.log("Gas estimate:", adapter.swapGasEstimate());

        vm.stopBroadcast();
    }
}
