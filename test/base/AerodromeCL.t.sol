// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.0;

import {BaseTestBase} from "./BaseTestBase.sol";
import {AerodromeCLAdapter} from "../../src/adapters/AerodromeCLAdapter.sol";

contract AerodromeCLTest is BaseTestBase {
    address public constant USDC = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;
    address public constant STATIC_QUOTER = 0xCcbe0b63149Ac6546ce74d21953D3687c7502253;
    address public constant AERODROME_CL_FACTORY = 0x5e7BB104d84c7CB9B682AaC2F3d509f5F406809A;

    uint256 public constant GAS_ESTIMATE = 180_000;

    function _createAdapter() internal returns (AerodromeCLAdapter) {
        return new AerodromeCLAdapter("AerodromeCL", GAS_ESTIMATE, STATIC_QUOTER, AERODROME_CL_FACTORY);
    }

    function test_swapMatchesQuery() public {
        AerodromeCLAdapter adapter = _createAdapter();

        uint256 snapshot = vm.snapshotState();

        assertSwapMatchesQuery(adapter, WETH, USDC, 1e18);

        vm.revertToState(snapshot);

        assertSwapMatchesQuery(adapter, USDC, WETH, 100e6);
    }

    function test_queryShouldReturnZero() public {
        AerodromeCLAdapter adapter = _createAdapter();

        assertQueryReturnsZero(adapter, WETH, WETH, 1e18);
        assertQueryReturnsZero(adapter, USDC, USDC, 100e6);
    }

    function test_queryReturnsZeroForUnsupportedTokens() public {
        AerodromeCLAdapter adapter = _createAdapter();

        assertQueryReturnsZeroForUnsupportedTokens(adapter, WETH);
    }
}
