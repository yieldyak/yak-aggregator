// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.0;

import {BaseTestBase} from "./BaseTestBase.sol";
import {UniswapV3Adapter} from "../../src/adapters/UniswapV3Adapter.sol";

contract UniswapV3Test is BaseTestBase {
    address public constant USDC = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;
    address public constant UNISWAP_V3_FACTORY = 0x33128a8fC17869897dcE68Ed026d694621f6FDfD;
    address public constant QUOTER = 0x28aF629a9F3ECE3c8D9F0b7cCf6349708CeC8cFb;

    uint256 public constant GAS_ESTIMATE = 185_000;
    uint256 public constant QUOTER_GAS_LIMIT = 500_000;

    uint24[] public defaultFees = new uint24[](4);

    function setUp() public {
        defaultFees[0] = 100;
        defaultFees[1] = 500;
        defaultFees[2] = 3000;
        defaultFees[3] = 10000;
    }

    function _createAdapter() internal returns (UniswapV3Adapter) {
        return
            new UniswapV3Adapter("UniswapV3", GAS_ESTIMATE, QUOTER_GAS_LIMIT, QUOTER, UNISWAP_V3_FACTORY, defaultFees);
    }

    function test_swapMatchesQuery() public {
        UniswapV3Adapter adapter = _createAdapter();

        uint256 snapshot = vm.snapshotState();

        assertSwapMatchesQuery(adapter, WETH, USDC, 1e18);

        vm.revertToState(snapshot);

        assertSwapMatchesQuery(adapter, USDC, WETH, 100e6);
    }

    function test_queryShouldReturnZero() public {
        UniswapV3Adapter adapter = _createAdapter();

        assertQueryReturnsZero(adapter, WETH, WETH, 1e18);
        assertQueryReturnsZero(adapter, USDC, USDC, 100e6);
    }

    function test_queryReturnsZeroForUnsupportedTokens() public {
        UniswapV3Adapter adapter = _createAdapter();

        assertQueryReturnsZeroForUnsupportedTokens(adapter, WETH);
    }
}
