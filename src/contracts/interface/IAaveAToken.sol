// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IAaveAToken {
    function POOL() external view returns (address);
    function UNDERLYING_ASSET_ADDRESS() external view returns (address);
}
