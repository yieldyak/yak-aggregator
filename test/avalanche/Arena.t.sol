// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.0;

import {AvalancheTestBase} from "./AvalancheTestBase.sol";
import {ArenaAdapter} from "../../src/adapters/ArenaAdapter.sol";

contract ArenaTest is AvalancheTestBase {
    address public poolManager = 0x06380C0e0912312B5150364B9DC4542BA0DbBc85;
    address public staticQuoter = 0x399AbdD1af8A67a6e9511e0BF616B8c18e3f5D1b;
    address public hook = 0xE32A5d788c568FC5A671255d17B618e70552E044;
    address public constant V4 = 0xE9f304856469e2d263BaACD390F598F291b87E0F;

    uint256 public constant GAS_ESTIMATE = 199_610;
    uint24 public constant FEE_TIER = 3000;
    int24 public constant TICK_SPACING = 200;

    function test_swapMatchesQuery() public {
        ArenaAdapter adapter =
            new ArenaAdapter("Arena", GAS_ESTIMATE, staticQuoter, poolManager, FEE_TIER, TICK_SPACING, hook);

        // Test V4 -> WAVAX
        assertSwapMatchesQuery(adapter, V4, WAVAX, 10e18);

        // Test WAVAX -> V4
        assertSwapMatchesQuery(adapter, WAVAX, V4, 1e18);
    }

    function test_queryReturnsZeroForUnsupportedTokens() public {
        ArenaAdapter adapter =
            new ArenaAdapter("Arena", GAS_ESTIMATE, staticQuoter, poolManager, FEE_TIER, TICK_SPACING, hook);

        // Test with V4 as supported token
        assertQueryReturnsZeroForUnsupportedTokens(adapter, V4);
    }

    function test_gasEstimateIsSensible() public {
        ArenaAdapter adapter =
            new ArenaAdapter("Arena", GAS_ESTIMATE, staticQuoter, poolManager, FEE_TIER, TICK_SPACING, hook);

        // Create array of swap options to test
        SwapOption[] memory options = new SwapOption[](2);
        options[0] = SwapOption(10e18, V4, WAVAX);
        options[1] = SwapOption(1e18, WAVAX, V4);

        // Test with default 10% accuracy
        assertGasEstimateIsSensible(adapter, options);
    }
}

