// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0;

interface IDepositFor {
    function depositFor(address account, uint amount) external;
}