// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.0;

import {AvalancheTestBase} from "./AvalancheTestBase.sol";
import {PangolinV3Adapter} from "../../src/adapters/PangolinV3Adapter.sol";

contract PangolinV3Test is AvalancheTestBase {
    address public pangolinFactory = 0x1128F23D0bc0A8396E9FBC3c0c68f5EA228B8256;
    address public pangolinQuoter = 0xD2Cb7571AD74Fc59c757a682B3dC503dCc256AAB;

    uint256 public constant GAS_ESTIMATE = 170_000;

    uint24[] public defaultFees = new uint24[](4);

    function setUp() public {
        defaultFees[0] = 100;
        defaultFees[1] = 500;
        defaultFees[2] = 2500;
        defaultFees[3] = 8000;
    }

    function test_swapMatchesQuery() public {
        PangolinV3Adapter adapter =
            new PangolinV3Adapter("Pangolin", GAS_ESTIMATE, 300_000, pangolinQuoter, pangolinFactory, defaultFees);

        assertSwapMatchesQuery(adapter, WAVAX, USDC, 10e18);
        assertSwapMatchesQuery(adapter, USDC, WAVAX, 100e6);
    }

    function test_queryReturnsZeroForUnsupportedTokens() public {
        PangolinV3Adapter adapter =
            new PangolinV3Adapter("Pangolin", GAS_ESTIMATE, 300_000, pangolinQuoter, pangolinFactory, defaultFees);

        // Test with USDC as supported token
        assertQueryReturnsZeroForUnsupportedTokens(adapter, USDC);
    }

    function test_gasEstimateIsSensible() public {
        PangolinV3Adapter adapter =
            new PangolinV3Adapter("Pangolin", GAS_ESTIMATE, 300_000, pangolinQuoter, pangolinFactory, defaultFees);

        // Create array of swap options to test
        SwapOption[] memory options = new SwapOption[](1);
        options[0] = SwapOption(1e18, WAVAX, USDC);

        // Test with default 10% accuracy
        assertGasEstimateIsSensible(adapter, options);
    }
}
