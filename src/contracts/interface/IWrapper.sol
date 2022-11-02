// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./IAdapter.sol";

interface IWrapper is IAdapter {
    function getTokensIn() external view returns (address[] memory);
    function getTokensOut() external view returns (address[] memory);
    function getWrappedToken() external view returns (address);
}