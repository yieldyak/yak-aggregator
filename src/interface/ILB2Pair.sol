// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface ILBPair {
    function getTokenX() external view returns (address);

    function getTokenY() external view returns (address);

    function swap(bool swapForY, address to) external returns (bytes32 amountsOut);

    function getSwapOut(uint128 amountIn, bool swapForY)
        external
        view
        returns (uint128 amountInLeft, uint128 amountOut, uint128 fee);
}
