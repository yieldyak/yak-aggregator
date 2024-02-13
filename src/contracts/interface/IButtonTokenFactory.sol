// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.4;

interface IButtonTokenFactory {
    //@dev https://github.com/buttonwood-protocol/button-wrappers/blob/main/contracts/utilities/InstanceRegistry.sol#L33
    function isInstance(address instance) external view returns (bool validity);
}
