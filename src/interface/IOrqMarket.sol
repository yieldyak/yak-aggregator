// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.0;

/// @notice Minimal orq FIFO market surface for YakAdapter integration.
interface IOrqMarket {
    function tokenOut() external view returns (address);

    function tokenIn() external view returns (address);

    function quote(uint256 amountIn) external view returns (uint256 amountOut, uint256 fee);

    function swap(address receiver) external returns (uint256 amountOut);
}
