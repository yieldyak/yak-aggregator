// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// @note: operator stands for interface address
interface IgAVAX {
    function setApprovalForAll(address operator, bool approved) external;

    function pricePerShare(uint256 _id) external view returns (uint256);

    function balanceOf(address account, uint256 id) external view returns (uint256);

    function isInterface(address operator, uint256 id) external view returns (bool);

    function isApprovedForAll(address account, address operator) external view returns (bool);
}
