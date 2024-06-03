// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IAavePool {
    function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external;
}
