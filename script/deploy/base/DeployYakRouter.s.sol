// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.0;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../../../src/YakRouter.sol";

// forge script script/deploy/base/DeployYakRouter.s.sol:DeployYakRouter --account deployer --rpc-url base --broadcast --skip-simulation -vvvv --verify --retries 20 --delay 15 --etherscan-api-key "$ETHERSCAN_API_KEY"

contract DeployYakRouter is Script {
    address public constant WETH = 0x4200000000000000000000000000000000000006;
    address public constant USDC = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;

    function run() external {
        vm.startBroadcast();

        address[] memory adapters = new address[](0);
        address[] memory trustedTokens = new address[](2);
        trustedTokens[0] = WETH;
        trustedTokens[1] = USDC;

        address feeClaimer = vm.envAddress("TEAM_MULTISIG");

        YakRouter router = new YakRouter(adapters, trustedTokens, feeClaimer, WETH);

        console.log("YakRouter deployed at:", address(router));
        console.log("WNative:", router.WNATIVE());
        console.log("Fee claimer:", router.FEE_CLAIMER());
        console.log("Trusted tokens:", router.trustedTokensCount());
        console.log("Adapters:", router.adaptersCount());

        vm.stopBroadcast();
    }
}
