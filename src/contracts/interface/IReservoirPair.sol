// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

interface IReservoirPair {
    function token0() external returns (address);
    function token1() external returns (address);
    function swap(int256 aAmount, bool aExactIn, address aTo, bytes calldata aData)
        external
        returns (uint256 rAmountOut);
}
