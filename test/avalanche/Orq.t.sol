// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.0;

import {AvalancheTestBase} from "./AvalancheTestBase.sol";
import {OrqAdapter} from "../../src/adapters/OrqAdapter.sol";

contract OrqTest is AvalancheTestBase {
    address public constant ORQ_FACTORY = 0xab27768782924B57d39b3E42E19556DE333f3f80;

    /// @dev Measured on fork (swap path); must sit in [maxActual, maxActual * 1.1] per AdapterTestBase.
    uint256 public constant GAS_ESTIMATE = 120_000;

    function test_swapMatchesQuery() public {
        OrqAdapter adapter = new OrqAdapter("Orq", ORQ_FACTORY, GAS_ESTIMATE);

        assertSwapMatchesQuery(adapter, USDC, WAVAX, 500_000); // 0.5 USDC
        assertSwapMatchesQuery(adapter, WAVAX, USDC, 0.1 ether); // 0.1 WAVAX
    }

    function test_queryReturnsZeroForUnsupportedTokens() public {
        OrqAdapter adapter = new OrqAdapter("Orq", ORQ_FACTORY, GAS_ESTIMATE);

        assertQueryReturnsZeroForUnsupportedTokens(adapter, USDC);
    }

    function test_gasEstimateIsSensible() public {
        OrqAdapter adapter = new OrqAdapter("Orq", ORQ_FACTORY, GAS_ESTIMATE);

        SwapOption[] memory options = new SwapOption[](2);
        options[0] = SwapOption(500_000, USDC, WAVAX);
        options[1] = SwapOption(0.1 ether, WAVAX, USDC);

        assertGasEstimateIsSensible(adapter, options);
    }
}
