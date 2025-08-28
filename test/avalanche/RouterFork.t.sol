// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.0;

import {Test} from "forge-std/Test.sol";
import {console} from "forge-std/console.sol";
import {AvalancheTestBase} from "./AvalancheTestBase.sol";
import {YakRouter} from "../../src/YakRouter.sol";
import {DeploymentFactory} from "../../deployments/utils/DeploymentFactory.sol";
import {INetworkDeployments} from "../../deployments/utils/INetworkDeployments.sol";
import {IYakRouter, FormattedOffer} from "../../src/interface/IYakRouter.sol";
import {IAdapter} from "../../src/interface/IAdapter.sol";

interface IOwnable {
    function owner() external view returns (address);
}

/**
 * @title RouterForkTest
 * @notice Fork test for the deployed Avalanche YakRouter to verify it's working correctly
 * @dev Tests AVAX to USDC quotes with different amounts to ensure router functionality
 */
contract RouterForkTest is AvalancheTestBase {
    YakRouter public router;

    // Test amounts (in AVAX)
    uint256 constant SMALL_AMOUNT = 10 ether; // 10 AVAX
    uint256 constant MEDIUM_AMOUNT = 100 ether; // 100 AVAX
    uint256 constant LARGE_AMOUNT = 1000 ether; // 1000 AVAX

    // Max steps for routing
    uint256 constant MAX_STEPS = 2;

    function setUp() public {
        // Get deployed router address
        DeploymentFactory factory = new DeploymentFactory();
        INetworkDeployments deployments = factory.getDeployments();

        router = YakRouter(payable(deployments.getRouter()));

        // Verify router is deployed and has adapters
        require(address(router) != address(0), "Router not deployed");
        require(router.adaptersCount() > 0, "No adapters in router");

        address owner = IOwnable(address(router)).owner();
        vm.startPrank(owner);
        router.setTrustedTokens(deployments.getWhitelistedHopTokens());
        vm.stopPrank();
        console.log("Router owner:", owner);

        console.log("Testing with YakRouter at:", address(router));
        console.log("Total adapters:", router.adaptersCount());
    }

    function test_avaxToUsdcQuote_SmallAmount() public view {
        FormattedOffer memory offer = router.findBestPath(SMALL_AMOUNT, WAVAX, USDC, MAX_STEPS);

        _validateOffer(offer, SMALL_AMOUNT, WAVAX, USDC);
        console.log("1 AVAX -> USDC quote:", offer.amounts[offer.amounts.length - 1]);
    }

    function test_avaxToUsdcQuote_MediumAmount() public view {
        FormattedOffer memory offer = router.findBestPath(MEDIUM_AMOUNT, WAVAX, USDC, MAX_STEPS);

        _validateOffer(offer, MEDIUM_AMOUNT, WAVAX, USDC);
        console.log("10 AVAX -> USDC quote:", offer.amounts[offer.amounts.length - 1]);
    }

    function test_avaxToUsdcQuote_LargeAmount() public view {
        FormattedOffer memory offer = router.findBestPath(LARGE_AMOUNT, WAVAX, USDC, MAX_STEPS);

        _validateOffer(offer, LARGE_AMOUNT, WAVAX, USDC);
        console.log("100 AVAX -> USDC quote:", offer.amounts[offer.amounts.length - 1]);
    }

    function test_compareQuotes_DifferentAmounts() public view {
        FormattedOffer memory smallOffer = router.findBestPath(SMALL_AMOUNT, WAVAX, USDC, MAX_STEPS);
        FormattedOffer memory mediumOffer = router.findBestPath(MEDIUM_AMOUNT, WAVAX, USDC, MAX_STEPS);
        FormattedOffer memory largeOffer = router.findBestPath(LARGE_AMOUNT, WAVAX, USDC, MAX_STEPS);

        uint256 smallOut = smallOffer.amounts[smallOffer.amounts.length - 1];
        uint256 mediumOut = mediumOffer.amounts[mediumOffer.amounts.length - 1];
        uint256 largeOut = largeOffer.amounts[largeOffer.amounts.length - 1];

        console.log("Quote comparison:");
        console.log("10 AVAX -> %d USDC", smallOut);
        console.log("100 AVAX -> %d USDC", mediumOut);
        console.log("1000 AVAX -> %d USDC", largeOut);

        // Verify quotes scale reasonably (allowing for slippage)
        // Medium should be roughly 10x small (within 1% tolerance for slippage)
        uint256 expectedMedium = smallOut * 10;
        uint256 mediumTolerance = expectedMedium * 1 / 100; // 1% tolerance

        assertGt(mediumOut, expectedMedium - mediumTolerance, "Medium quote too low");
        assertLt(mediumOut, expectedMedium + mediumTolerance, "Medium quote too high");

        // Large should be roughly 100x small (within 1% tolerance for higher slippage)
        uint256 expectedLarge = smallOut * 100;
        uint256 largeTolerance = expectedLarge * 1 / 100; // 1% tolerance

        assertGt(largeOut, expectedLarge - largeTolerance, "Large quote too low");
        assertLt(largeOut, expectedLarge + largeTolerance, "Large quote too high");
    }

    function _validateOffer(FormattedOffer memory offer, uint256 amountIn, address tokenIn, address tokenOut)
        internal
        pure
    {
        // Basic validations
        assertGt(offer.amounts.length, 0, "No amounts in offer");
        assertGt(offer.adapters.length, 0, "No adapters in offer");
        assertGt(offer.path.length, 1, "Path too short");
        assertGt(offer.gasEstimate, 0, "No gas estimate");

        // Path should start with tokenIn and end with tokenOut
        assertEq(offer.path[0], tokenIn, "Path doesn't start with tokenIn");
        assertEq(offer.path[offer.path.length - 1], tokenOut, "Path doesn't end with tokenOut");

        // First amount should equal input amount
        assertEq(offer.amounts[0], amountIn, "First amount doesn't match input");

        // Output amount should be reasonable (> 0 and not equal to input)
        uint256 amountOut = offer.amounts[offer.amounts.length - 1];
        assertGt(amountOut, 0, "Zero output amount");
    }
}
