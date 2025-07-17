// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.0;

import {AvalancheTestBase} from "./AvalancheTestBase.sol";
import {BlackholeAdapter} from "../../src/adapters/BlackholeAdapter.sol";

contract BlackholeTest is AvalancheTestBase {
    address public blackholeFactory = 0xfE926062Fb99CA5653080d6C14fE945Ad68c265C;

    uint256 public constant GAS_ESTIMATE = 170_000;

    function test_swapMatchesQuery() public {
        BlackholeAdapter adapter = new BlackholeAdapter("Blackhole", blackholeFactory, GAS_ESTIMATE);

        assertSwapMatchesQuery(adapter, BLACK, USDC, 1e18);
        assertSwapMatchesQuery(adapter, SUPER, BLACK, 100e18);
    }

    function test_queryReturnsZeroForUnsupportedTokens() public {
        BlackholeAdapter adapter = new BlackholeAdapter("Blackhole", blackholeFactory, GAS_ESTIMATE);

        // Test with USDC as supported token
        assertQueryReturnsZeroForUnsupportedTokens(adapter, USDC);
    }

    function test_gasEstimateIsSensible() public {
        BlackholeAdapter adapter = new BlackholeAdapter("Blackhole", blackholeFactory, GAS_ESTIMATE);

        // Create array of swap options to test
        SwapOption[] memory options = new SwapOption[](1);
        options[0] = SwapOption(1e18, BLACK, USDC);

        // Test with default 10% accuracy
        assertGasEstimateIsSensible(adapter, options);
    }
}
