// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.0;

import {AvalancheTestBase} from "./AvalancheTestBase.sol";
import {VelodromeAdapter} from "../../src/adapters/VelodromeAdapter.sol";

contract PharaohLegacyTest is AvalancheTestBase {
    address public pharaohFactory = 0xAAA16c016BF556fcD620328f0759252E29b1AB57;

    uint256 public constant GAS_ESTIMATE = 185_000;

    address public constant IGNORED_PAIR = 0x2A1e0770c1384FF8047d8638FA929106B260a6bF;

    function test_swapMatchesQuery() public {
        VelodromeAdapter adapter = new VelodromeAdapter("PharaohLegacy", pharaohFactory, GAS_ESTIMATE);

        assertSwapMatchesQuery(adapter, WAVAX, USDC, 1e18);
        assertSwapMatchesQuery(adapter, USDC, USDT, 100e6);
    }

    function test_queryReturnsZeroForUnsupportedTokens() public {
        VelodromeAdapter adapter = new VelodromeAdapter("PharaohLegacy", pharaohFactory, GAS_ESTIMATE);

        // Test with USDC as supported token
        assertQueryReturnsZeroForUnsupportedTokens(adapter, USDC);
    }

    function test_gasEstimateIsSensible() public {
        VelodromeAdapter adapter = new VelodromeAdapter("PharaohLegacy", pharaohFactory, GAS_ESTIMATE);

        // Create array of swap options to test
        SwapOption[] memory options = new SwapOption[](1);
        options[0] = SwapOption(1e18, WAVAX, USDC);

        // Test with default 10% accuracy
        assertGasEstimateIsSensible(adapter, options);
    }

    function test_badPair() public {
        VelodromeAdapter adapter = new VelodromeAdapter("PharaohLegacy", pharaohFactory, GAS_ESTIMATE);

        assertSwapMatchesQuery(adapter, WAVAX, USDC, 1e15);
    }
}
