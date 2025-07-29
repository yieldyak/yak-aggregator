// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.0;

import {AvalancheTestBase} from "./AvalancheTestBase.sol";
import {LB2Adapter} from "../../src/adapters/LB2Adapter.sol";

contract LiquidityBook22Test is AvalancheTestBase {
    address public lb22Factory = 0xb43120c4745967fa9b93E79C149E66B0f2D6Fe0c;

    uint256 public constant GAS_ESTIMATE = 216_440;
    uint256 public constant QUOTE_GAS_LIMIT = 50_000; // Reduced from default 600k

    function test_swapMatchesQuery() public {
        LB2Adapter adapter = new LB2Adapter("LiquidityBook-2.2", GAS_ESTIMATE, QUOTE_GAS_LIMIT, lb22Factory);

        assertSwapMatchesQuery(adapter, WAVAX, USDC, 1000e18);
        assertSwapMatchesQuery(adapter, USDC, WAVAX, 1000e6);
    }

    function test_queryReturnsZeroForUnsupportedTokens() public {
        LB2Adapter adapter = new LB2Adapter("LiquidityBook-2.2", GAS_ESTIMATE, QUOTE_GAS_LIMIT, lb22Factory);

        // Test with USDC as supported token
        assertQueryReturnsZeroForUnsupportedTokens(adapter, USDC);
    }

    function test_gasEstimateIsSensible() public {
        LB2Adapter adapter = new LB2Adapter("LiquidityBook-2.2", GAS_ESTIMATE, QUOTE_GAS_LIMIT, lb22Factory);

        // Create array of swap options to test
        SwapOption[] memory options = new SwapOption[](2);
        options[0] = SwapOption(1e18, WAVAX, USDC);
        options[1] = SwapOption(1000e6, USDC, WAVAX);

        // Test with default 10% accuracy
        assertGasEstimateIsSensible(adapter, options);
    }

    function test_gasLimitConfiguration() public {
        LB2Adapter adapter = new LB2Adapter("LiquidityBook-2.2", GAS_ESTIMATE, QUOTE_GAS_LIMIT, lb22Factory);

        // Test configured gas limit
        assertEq(adapter.quoteGasLimit(), QUOTE_GAS_LIMIT);

        // Test gas limit can be updated
        adapter.setQuoteGasLimit(30_000);
        assertEq(adapter.quoteGasLimit(), 30_000);
    }

    function test_pairFiltering() public {
        LB2Adapter adapter = new LB2Adapter("LiquidityBook-2.2", GAS_ESTIMATE, QUOTE_GAS_LIMIT, lb22Factory);

        // Test default settings
        assertTrue(adapter.allowIgnoredPairs());
        assertTrue(adapter.allowExternalPairs());

        // Test filtering can be configured
        adapter.setAllowIgnoredPairs(false);
        adapter.setAllowExternalPairs(false);

        assertFalse(adapter.allowIgnoredPairs());
        assertFalse(adapter.allowExternalPairs());
    }

    function test_factoryAddress() public {
        LB2Adapter adapter = new LB2Adapter("LiquidityBook-2.2", GAS_ESTIMATE, QUOTE_GAS_LIMIT, lb22Factory);

        assertEq(adapter.FACTORY(), lb22Factory);
    }

    function test_lowGasLimitFiltersExpensivePairs() public {
        // Test that a very low gas limit effectively filters out expensive pairs
        LB2Adapter lowGasAdapter = new LB2Adapter(
            "LiquidityBook-2.2-LowGas",
            GAS_ESTIMATE,
            10_000, // Very low gas limit
            lb22Factory
        );

        LB2Adapter normalAdapter = new LB2Adapter(
            "LiquidityBook-2.2-Normal",
            GAS_ESTIMATE,
            600_000, // Normal gas limit
            lb22Factory
        );

        uint256 lowGasQuote = lowGasAdapter.query(1000e18, WAVAX, USDC);
        uint256 normalQuote = normalAdapter.query(1000e18, WAVAX, USDC);

        // Low gas adapter should either return 0 or a valid but potentially lower quote
        // Normal adapter should return a quote if liquidity exists
        if (normalQuote > 0) {
            // If normal adapter finds liquidity, low gas adapter might find less due to gas constraints
            assertTrue(lowGasQuote <= normalQuote, "Low gas adapter should not exceed normal adapter");
        }
    }
}
