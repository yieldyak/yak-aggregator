// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.0;

import {AvalancheTestBase} from "./AvalancheTestBase.sol";
import {LB2Adapter} from "../../src/adapters/LB2Adapter.sol";

contract LiquidityBook21Test is AvalancheTestBase {
    address public lb21Factory = 0x8e42f2F4101563bF679975178e880FD87d3eFd4e;

    uint256 public constant GAS_ESTIMATE = 250_000;
    uint256 public constant QUOTE_GAS_LIMIT = 100_000; // Higher limit for LB 2.1

    function test_swapMatchesQuery() public {
        LB2Adapter adapter = new LB2Adapter("LiquidityBook-2.1", GAS_ESTIMATE, QUOTE_GAS_LIMIT, lb21Factory);

        assertSwapMatchesQuery(adapter, WAVAX, USDC, 1000e18);
        assertSwapMatchesQuery(adapter, USDC, WAVAX, 1000e6);
    }

    function test_queryReturnsZeroForUnsupportedTokens() public {
        LB2Adapter adapter = new LB2Adapter("LiquidityBook-2.1", GAS_ESTIMATE, QUOTE_GAS_LIMIT, lb21Factory);

        // Test with USDC as supported token
        assertQueryReturnsZeroForUnsupportedTokens(adapter, USDC);
    }

    function test_gasEstimateIsSensible() public {
        LB2Adapter adapter = new LB2Adapter("LiquidityBook-2.1", GAS_ESTIMATE, QUOTE_GAS_LIMIT, lb21Factory);

        // Create array of swap options to test
        SwapOption[] memory options = new SwapOption[](2);
        options[0] = SwapOption(1e18, WAVAX, USDC);
        options[1] = SwapOption(1000e6, USDC, WAVAX);

        // Test with default 10% accuracy
        assertGasEstimateIsSensible(adapter, options);
    }

    function test_gasLimitConfiguration() public {
        LB2Adapter adapter = new LB2Adapter("LiquidityBook-2.1", GAS_ESTIMATE, QUOTE_GAS_LIMIT, lb21Factory);

        // Test configured gas limit
        assertEq(adapter.quoteGasLimit(), QUOTE_GAS_LIMIT);

        // Test gas limit can be updated
        adapter.setQuoteGasLimit(30_000);
        assertEq(adapter.quoteGasLimit(), 30_000);
    }

    function test_pairFiltering() public {
        LB2Adapter adapter = new LB2Adapter("LiquidityBook-2.1", GAS_ESTIMATE, QUOTE_GAS_LIMIT, lb21Factory);

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
        LB2Adapter adapter = new LB2Adapter("LiquidityBook-2.1", GAS_ESTIMATE, QUOTE_GAS_LIMIT, lb21Factory);

        assertEq(adapter.FACTORY(), lb21Factory);
    }
}
