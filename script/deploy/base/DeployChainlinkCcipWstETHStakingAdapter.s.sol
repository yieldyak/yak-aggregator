// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.0;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../../../src/adapters/ChainlinkCcipStakingAdapter.sol";

// forge script script/deploy/base/DeployChainlinkCcipWstETHStakingAdapter.s.sol:DeployChainlinkCcipWstETHStakingAdapter --account deployer --rpc-url base --broadcast -vvvv --verify --retries 20 --delay 15 --etherscan-api-key "$BASESCAN_KEY"

contract DeployChainlinkCcipWstETHStakingAdapter is Script {
    function run() external {
        vm.startBroadcast();

        // Deployment parameters
        string memory name = "ChainlinkCcipWstETHStaking";
        address staking = 0x328de900860816d29D1367F6903a24D8ed40C997;
        uint256 gasEstimate = 160_000;

        // Deploy the adapter
        ChainlinkCcipStakingAdapter adapter = new ChainlinkCcipStakingAdapter(name, staking, gasEstimate);

        console.log("ChainlinkCcipStakingAdapter deployed at:", address(adapter));
        console.log("Name:", adapter.name());
        console.log("Gas estimate:", adapter.swapGasEstimate());
        console.log("Staking contract:", adapter.staking());
        console.log("Oracle pool:", adapter.oraclePool());
        console.log("Token in:", adapter.tokenIn());
        console.log("Token out:", adapter.tokenOut());

        vm.stopBroadcast();
    }
}
