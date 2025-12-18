// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.0;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../../../src/adapters/UniswapV4Adapter.sol";

// forge script script/deploy/avalanche/DeployUniswapV4Adapter.s.sol:DeployUniswapV4Adapter --account deployer --rpc-url avalanche --broadcast --skip-simulation -vvvv --verify --verifier-url 'https://api.routescan.io/v2/network/avalanche/evm/43114/etherscan' --etherscan-api-key "verifyContract"
//
// After deployment, pools must be added to the whitelist using adapter.addPool(PoolKey)
// Example common pools to add:
// - WAVAX/USDC: fee 500, tickSpacing 1
// - WAVAX/USDC: fee 3000, tickSpacing 10
// - WAVAX/USDC: fee 10000, tickSpacing 60

contract DeployUniswapV4Adapter is Script {
    function run() external {
        vm.startBroadcast();

        // Deployment parameters
        string memory name = "UniswapV4Adapter";
        address poolManager = 0x06380C0e0912312B5150364B9DC4542BA0DbBc85;
        address staticQuoter = 0x399AbdD1af8A67a6e9511e0BF616B8c18e3f5D1b;
        address wrappedNative = 0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7; // WAVAX on Avalanche
        uint256 gasEstimate = 200_000;

        // Deploy the adapter
        UniswapV4Adapter adapter = new UniswapV4Adapter(name, gasEstimate, staticQuoter, poolManager, wrappedNative);

        console.log("UniswapV4Adapter deployed at:", address(adapter));
        console.log("Name:", adapter.name());
        console.log("Gas estimate:", adapter.swapGasEstimate());
        console.log("Pool Manager:", address(adapter.poolManager()));
        console.log("Static Quoter:", address(adapter.staticQuoter()));
        console.log("");
        console.log("NOTE: Pools must be added to the whitelist after deployment using adapter.addPool(PoolKey)");

        vm.stopBroadcast();
    }
}

