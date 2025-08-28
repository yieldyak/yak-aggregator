// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IApexFactory {
    function isWrappedToken(address token) external view returns (bool);
}
