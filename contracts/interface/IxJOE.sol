// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0;

interface IxJOE {
    function leave(uint) external;
    function enter(uint) external;
    function totalSupply() external view returns (uint);
}