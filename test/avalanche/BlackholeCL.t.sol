// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.0;

import {AvalancheTestBase} from "./AvalancheTestBase.sol";
import {AlgebraIntegralAdapter} from "../../src/adapters/AlgebraIntegralAdapter.sol";

contract BlackholeCLTest is AvalancheTestBase {
    address public blackholeFactory = 0x512eb749541B7cf294be882D636218c84a5e9E5F;
    address public blackholeQuoter = 0x1f424ffae1A36Ee71Fc236eDd7CFD0a486Ea84E0;

    uint256 public constant GAS_ESTIMATE = 170_000;

    function test_swapMatchesQuery() public {
        AlgebraIntegralAdapter adapter =
            new AlgebraIntegralAdapter("Blackhole", GAS_ESTIMATE, 300_000, blackholeQuoter, blackholeFactory);

        assertSwapMatchesQuery(adapter, WAVAX, USDC, 10000e18);
        assertSwapMatchesQuery(adapter, USDC, WAVAX, 100e6);
    }

    function test_queryReturnsZeroForUnsupportedTokens() public {
        AlgebraIntegralAdapter adapter =
            new AlgebraIntegralAdapter("Blackhole", GAS_ESTIMATE, 300_000, blackholeQuoter, blackholeFactory);

        // Test with USDC as supported token
        assertQueryReturnsZeroForUnsupportedTokens(adapter, USDC);
    }

    function test_gasEstimateIsSensible() public {
        AlgebraIntegralAdapter adapter =
            new AlgebraIntegralAdapter("Blackhole", GAS_ESTIMATE, 300_000, blackholeQuoter, blackholeFactory);

        // Create array of swap options to test
        SwapOption[] memory options = new SwapOption[](1);
        options[0] = SwapOption(1e18, WAVAX, USDC);

        // Test with default 10% accuracy
        assertGasEstimateIsSensible(adapter, options);
    }
}
