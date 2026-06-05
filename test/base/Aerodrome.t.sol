// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.0;

import {BaseTestBase} from "./BaseTestBase.sol";
import {AerodromeAdapter} from "../../src/adapters/AerodromeAdapter.sol";

contract AerodromeTest is BaseTestBase {
    address public aerodromeFactory = 0x420DD381b31aEf6683db6B902084cB0FFECe40Da;

    uint256 public constant GAS_ESTIMATE = 180_000;

    function test_swapMatchesQuery() public {
        AerodromeAdapter adapter = new AerodromeAdapter("Aerodrome", aerodromeFactory, GAS_ESTIMATE);

        uint256 snapshot = vm.snapshotState();

        assertSwapMatchesQuery(adapter, WETH, msETH, 1e18);

        vm.revertToState(snapshot);

        assertSwapMatchesQuery(adapter, msETH, WETH, 1e18);
    }

    function test_queryShouldReturnZero() public {
        AerodromeAdapter adapter = new AerodromeAdapter("Aerodrome", aerodromeFactory, GAS_ESTIMATE);

        assertQueryReturnsZero(adapter, WETH, WETH, 1e18);
        assertQueryReturnsZero(adapter, msETH, msETH, 1e18);
    }

    function test_queryReturnsZeroForUnsupportedTokens() public {
        AerodromeAdapter adapter = new AerodromeAdapter("Aerodrome", aerodromeFactory, GAS_ESTIMATE);

        assertQueryReturnsZeroForUnsupportedTokens(adapter, WETH);
    }
}
