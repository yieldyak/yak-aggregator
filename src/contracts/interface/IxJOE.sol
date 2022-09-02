// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IxJOE {
    function leave(uint256) external;

    function enter(uint256) external;

    function totalSupply() external view returns (uint256);
}
