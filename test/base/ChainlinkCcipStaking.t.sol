// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.0;

import {BaseTestBase} from "./BaseTestBase.sol";
import {ChainlinkCcipStakingAdapter} from "../../src/adapters/ChainlinkCcipStakingAdapter.sol";

contract ChainlinkCcipStakingTest is BaseTestBase {
    address public constant WSTETH = 0xc1CBa3fCea344f92D9239c08C0568f6F2F0ee452;
    address public constant WSTETH_CCIP_STAKING = 0x328de900860816d29D1367F6903a24D8ed40C997;

    uint256 public constant GAS_ESTIMATE = 160_000;

    function _createAdapter() internal returns (ChainlinkCcipStakingAdapter) {
        return new ChainlinkCcipStakingAdapter("ChainlinkCcipWstETHStaking", WSTETH_CCIP_STAKING, GAS_ESTIMATE);
    }

    function test_swapMatchesQuery() public {
        ChainlinkCcipStakingAdapter adapter = _createAdapter();

        assertSwapMatchesQuery(adapter, WETH, WSTETH, 0.1e18, 0);
    }

    function test_queryReturnsZeroIfInsufficientLiquidity() public {
        ChainlinkCcipStakingAdapter adapter = _createAdapter();

        uint256 quoted = adapter.query(100_000e18, WETH, WSTETH);

        assertEq(quoted, 0, "Query should return zero if oracle pool liquidity is insufficient");
    }

    function test_queryShouldReturnZero() public {
        ChainlinkCcipStakingAdapter adapter = _createAdapter();

        assertQueryReturnsZero(adapter, WETH, WETH, 1e18);
        assertQueryReturnsZero(adapter, WSTETH, WETH, 1e18);
        assertQueryReturnsZero(adapter, WSTETH, WSTETH, 1e18);
    }

    function test_queryReturnsZeroForUnsupportedTokens() public {
        ChainlinkCcipStakingAdapter adapter = _createAdapter();

        assertQueryReturnsZeroForUnsupportedTokens(adapter, WETH);
    }

    function test_gasEstimateIsSensible() public {
        ChainlinkCcipStakingAdapter adapter = _createAdapter();

        SwapOption[] memory options = new SwapOption[](1);
        options[0] = SwapOption({amountIn: 0.1e18, tokenFrom: WETH, tokenTo: WSTETH});

        assertGasEstimateIsSensible(adapter, options, 20);
    }
}
