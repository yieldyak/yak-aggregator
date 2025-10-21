// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.0;

import {AvalancheTestBase} from "./AvalancheTestBase.sol";
import {PharAdapter} from "../../src/adapters/PharAdapter.sol";

contract PharCL is AvalancheTestBase {
    address public pharFactory = 0xAE6E5c62328ade73ceefD42228528b70c8157D0d;
    address public pharQuoter = 0x765FEbfe414A22c67fB0F64Fa540E74072E3793c;

    uint256 public constant GAS_ESTIMATE = 150_000;

    int24[] public defaultFees = new int24[](6);

    function setUp() public {
        defaultFees[0] = 1;
        defaultFees[1] = 5;
        defaultFees[2] = 10;
        defaultFees[3] = 50;
        defaultFees[4] = 100;
        defaultFees[5] = 200;
    }

    function test_swapMatchesQuery() public {
        PharAdapter adapter = new PharAdapter("PharCL", GAS_ESTIMATE, 120_000, pharQuoter, pharFactory, defaultFees);

        assertSwapMatchesQuery(adapter, WAVAX, USDC, 1000e18);
        assertSwapMatchesQuery(adapter, USDC, WAVAX, 100e6);
    }

    function test_queryReturnsZeroForUnsupportedTokens() public {
        PharAdapter adapter = new PharAdapter("PharCL", GAS_ESTIMATE, 300_000, pharQuoter, pharFactory, defaultFees);

        // Test with USDC as supported token
        assertQueryReturnsZeroForUnsupportedTokens(adapter, USDC);
    }

    function test_gasEstimateIsSensible() public {
        PharAdapter adapter = new PharAdapter("PharCL", GAS_ESTIMATE, 300_000, pharQuoter, pharFactory, defaultFees);

        // Create array of swap options to test
        SwapOption[] memory options = new SwapOption[](1);
        options[0] = SwapOption(1e18, WAVAX, USDC);

        // Test with default 10% accuracy
        assertGasEstimateIsSensible(adapter, options);
    }
}
