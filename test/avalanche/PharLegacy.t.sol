// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.0;

import {AvalancheTestBase} from "./AvalancheTestBase.sol";
import {PharLegacyAdapter} from "../../src/adapters/PharLegacyAdapter.sol";

contract PharLegacyTest is AvalancheTestBase {
    address public pharaohFactory = 0x85448bF2F589ab1F56225DF5167c63f57758f8c1;

    uint256 public constant GAS_ESTIMATE = 180_000;

    function test_swapMatchesQuery() public {
        PharLegacyAdapter adapter = new PharLegacyAdapter("PharLegacy", pharaohFactory, GAS_ESTIMATE);

        assertSwapMatchesQuery(adapter, WAVAX, PHAR, 50e18);
        assertSwapMatchesQuery(adapter, PHAR, USDC, 1e18);
    }

    function test_queryReturnsZeroForUnsupportedTokens() public {
        PharLegacyAdapter adapter = new PharLegacyAdapter("PharLegacy", pharaohFactory, GAS_ESTIMATE);

        // Test with USDC as supported token
        assertQueryReturnsZeroForUnsupportedTokens(adapter, USDC);
    }

    function test_gasEstimateIsSensible() public {
        PharLegacyAdapter adapter = new PharLegacyAdapter("PharLegacy", pharaohFactory, GAS_ESTIMATE);

        // Create array of swap options to test
        SwapOption[] memory options = new SwapOption[](1);
        options[0] = SwapOption(50e18, WAVAX, PHAR);

        // Test with default 10% accuracy
        assertGasEstimateIsSensible(adapter, options);
    }
}
