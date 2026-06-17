// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.0;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../../../src/adapters/UniswapV2Adapter.sol";

// forge script script/deploy/base/DeployUniswapV2Adapter.s.sol:DeployUniswapV2Adapter --account deployer --rpc-url base --broadcast -vvvv --verify --retries 20 --delay 15 --etherscan-api-key "$ETHERSCAN_API_KEY"

contract DeployUniswapV2Adapter is Script {
    function run() external {
        vm.startBroadcast();

        // Deployment parameters
        string memory name = "UniswapV2Adapter";
        address uniswapV2Factory = 0x8909Dc15e40173Ff4699343b6eB8132c65e18eC6;
        uint256 fee = 3;
        uint256 gasEstimate = 120_000;

        // Deploy the adapter
        UniswapV2Adapter adapter = new UniswapV2Adapter(name, uniswapV2Factory, fee, gasEstimate);

        console.log("UniswapV2Adapter deployed at:", address(adapter));
        console.log("Name:", adapter.name());
        console.log("Gas estimate:", adapter.swapGasEstimate());
        console.log("Factory:", adapter.factory());
        console.log("Fee compliment:", adapter.feeCompliment());

        vm.stopBroadcast();
    }
}
