// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.0;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../../../src/adapters/ArenaAdapter.sol";

// forge script script/deploy/avalanche/DeployArenaAdapter.s.sol:DeployArenaAdapter --account deployer --rpc-url avalanche --broadcast --skip-simulation -vvvv --verify --verifier-url 'https://api.routescan.io/v2/network/avalanche/evm/43114/etherscan' --etherscan-api-key "verifyContract"

contract DeployArenaAdapter is Script {
    function run() external {
        vm.startBroadcast();

        // Deployment parameters
        string memory name = "ArenaAdapter V2";
        address poolManager = 0x06380C0e0912312B5150364B9DC4542BA0DbBc85;
        address staticQuoter = 0x399AbdD1af8A67a6e9511e0BF616B8c18e3f5D1b;
        uint256 gasEstimate = 200_000;

        // Arena protocol specific parameters
        uint24 feeTier = 3000;
        int24 tickSpacing = 200;
        address hook = 0xE32A5d788c568FC5A671255d17B618e70552E044;

        // Deploy the adapter
        ArenaAdapter adapter =
            new ArenaAdapter(name, gasEstimate, staticQuoter, poolManager, feeTier, tickSpacing, hook);

        console.log("ArenaAdapter deployed at:", address(adapter));
        console.log("Name:", adapter.name());
        console.log("Gas estimate:", adapter.swapGasEstimate());
        console.log("Pool Manager:", address(adapter.poolManager()));
        console.log("Static Quoter:", address(adapter.staticQuoter()));
        console.log("Fee Tier:", adapter.feeTier());
        console.log("Tick Spacing:", adapter.tickSpacing());
        console.log("Hook:", address(adapter.hook()));
        console.log("Arena Fee Helper:", address(adapter.arenaFeeHelper()));

        vm.stopBroadcast();
    }
}
