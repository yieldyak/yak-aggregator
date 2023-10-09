// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

interface IReservoirPair {
    function getReserves() public view
        returns (uint104 rReserve0, uint104 rReserve1, uint32 rBlockTimestampLast, uint16 rIndex);
}
