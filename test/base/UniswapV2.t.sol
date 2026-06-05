// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.0;

import {BaseTestBase} from "./BaseTestBase.sol";
import {UniswapV2Adapter} from "../../src/adapters/UniswapV2Adapter.sol";

contract UniswapV2Test is BaseTestBase {
    address public constant USDC = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;
    address public constant UNISWAP_V2_FACTORY = 0x8909Dc15e40173Ff4699343b6eB8132c65e18eC6;

    uint256 public constant FEE = 3;
    uint256 public constant GAS_ESTIMATE = 120_000;

    function _createAdapter() internal returns (UniswapV2Adapter) {
        return new UniswapV2Adapter("UniswapV2", UNISWAP_V2_FACTORY, FEE, GAS_ESTIMATE);
    }

    function test_swapMatchesQuery() public {
        UniswapV2Adapter adapter = _createAdapter();

        uint256 snapshot = vm.snapshotState();

        assertSwapMatchesQuery(adapter, WETH, USDC, 1e18);

        vm.revertToState(snapshot);

        assertSwapMatchesQuery(adapter, USDC, WETH, 100e6);
    }

    function test_queryShouldReturnZero() public {
        UniswapV2Adapter adapter = _createAdapter();

        assertQueryReturnsZero(adapter, WETH, WETH, 1e18);
        assertQueryReturnsZero(adapter, USDC, USDC, 100e6);
    }

    function test_queryReturnsZeroForUnsupportedTokens() public {
        UniswapV2Adapter adapter = _createAdapter();

        assertQueryReturnsZeroForUnsupportedTokens(adapter, WETH);
    }
}
