// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.0;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../../../src/adapters/UniswapV3Adapter.sol";

// forge script script/deploy/base/DeployUniswapV3Adapter.s.sol:DeployUniswapV3Adapter --account deployer --rpc-url base --broadcast -vvvv --verify --retries 20 --delay 15 --etherscan-api-key "$ETHERSCAN_API_KEY"

contract DeployUniswapV3Adapter is Script {
    function run() external {
        vm.startBroadcast();

        // Deployment parameters
        string memory name = "UniswapV3Adapter";
        address uniswapV3Factory = 0x33128a8fC17869897dcE68Ed026d694621f6FDfD;
        address quoter = 0x28aF629a9F3ECE3c8D9F0b7cCf6349708CeC8cFb;
        uint256 gasEstimate = 185_000;
        uint256 quoterGasLimit = 500_000;
        uint24[] memory defaultFees = new uint24[](4);
        defaultFees[0] = 100;
        defaultFees[1] = 500;
        defaultFees[2] = 3000;
        defaultFees[3] = 10000;

        // Deploy the adapter
        UniswapV3Adapter adapter =
            new UniswapV3Adapter(name, gasEstimate, quoterGasLimit, quoter, uniswapV3Factory, defaultFees);

        console.log("UniswapV3Adapter deployed at:", address(adapter));
        console.log("Name:", adapter.name());
        console.log("Gas estimate:", adapter.swapGasEstimate());
        console.log("Quoter:", adapter.quoter());
        console.log("Quoter gas limit:", adapter.quoterGasLimit());

        vm.stopBroadcast();
    }
}
