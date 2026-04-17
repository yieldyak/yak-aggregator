// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.0;

/// @notice Minimal orq factory surface for market lookup.
interface IOrqMarketFactory {
    function getMarket(address tokenIn, address tokenOut) external view returns (address market);
}
