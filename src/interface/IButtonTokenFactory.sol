// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.4;

interface IButtonTokenFactory {
    //@dev https://github.com/buttonwood-protocol/button-wrappers/blob/main/contracts/utilities/InstanceRegistry.sol#L33
    function isInstance(address instance) external view returns (bool validity);

    //@dev https://github.com/buttonwood-protocol/button-wrappers/blob/main/contracts/utilities/InstanceRegistry.sol#L37
    function instanceCount() external view returns (uint256 count);

    //@dev https://github.com/buttonwood-protocol/button-wrappers/blob/main/contracts/utilities/InstanceRegistry.sol#L41
    function instanceAt(uint256 index) external view returns (address instance);
}
