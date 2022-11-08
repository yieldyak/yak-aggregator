// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IYYDerivative {
    function deposit(uint256 amount) external;

    function depositsEnabled() external view returns (bool);
}
