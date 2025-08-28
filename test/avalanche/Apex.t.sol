// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.0;

import {AvalancheTestBase} from "./AvalancheTestBase.sol";
import {ApexAdapter} from "../../src/adapters/ApexAdapter.sol";

contract ApexTest is AvalancheTestBase {
    address public apexRouter = 0x5d2dDA02280F55A9D4529eadFA45Ff032928082B;
    address public apexFactory = 0x709D667c0f7cb42e6099B1a2b2B71409086315Cc;

    uint256 public constant GAS_ESTIMATE = 140_000;

    function test_swapMatchesQuery() public {
        ApexAdapter adapter = new ApexAdapter("Apex", apexRouter, apexFactory, GAS_ESTIMATE, WAVAX);

        // Save initial state once
        uint256 snapshot = vm.snapshotState();

        // Test WAVAX to AKET swap
        assertSwapMatchesQuery(adapter, WAVAX, AKET, 1e18);

        // Reset to initial state
        vm.revertToState(snapshot);

        // Test AKET to WAVAX swap
        assertSwapMatchesQuery(adapter, AKET, WAVAX, 100e18);

        // Reset to initial state
        vm.revertToState(snapshot);

        // Test KET to WAVAX swap
        assertSwapMatchesQuery(adapter, KET, WAVAX, 1000e18);

        // Reset to initial state
        vm.revertToState(snapshot);

        // Test WAVAX to KET swap
        assertSwapMatchesQuery(adapter, WAVAX, KET, 10e18);

        // Reset to initial state
        vm.revertToState(snapshot);

        // Test WAVAX to BTCb swap
        assertSwapMatchesQuery(adapter, WAVAX, BTCb, 1e18);
    }

    function test_queryShouldReturnZero() public {
        ApexAdapter adapter = new ApexAdapter("Apex", apexRouter, apexFactory, GAS_ESTIMATE, WAVAX);
        assertQueryReturnsZero(adapter, WAVAX, WAVAX, 1e18);
        assertQueryReturnsZero(adapter, WAVAX, USDC, 1e18);
        assertQueryReturnsZero(adapter, WAVAX, USDT, 1e18);
    }

    function test_queryReturnsZeroForUnsupportedTokens() public {
        ApexAdapter adapter = new ApexAdapter("Apex", apexRouter, apexFactory, GAS_ESTIMATE, WAVAX);

        // Test with WAVAX as supported token
        assertQueryReturnsZeroForUnsupportedTokens(adapter, WAVAX);
    }

    // function test_gasEstimateIsSensible() public {
    //     ApexAdapter adapter = new ApexAdapter("Apex", apexRouter, apexFactory, GAS_ESTIMATE, WAVAX);

    //     // Create array of swap options to test
    //     SwapOption[] memory options = new SwapOption[](2);
    //     options[0] = SwapOption(1e18, WAVAX, AKET);
    //     options[1] = SwapOption(1000e18, AKET, WAVAX);

    //     // Test with default 10% accuracy
    //     assertGasEstimateIsSensible(adapter, options);
    // }
}
