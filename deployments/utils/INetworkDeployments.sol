// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface INetworkDeployments {
    function getRouter() external view returns (address);
    function getWhitelistedAdapters() external view returns (address[] memory);
    function getWhitelistedHopTokens() external view returns (address[] memory);
    function getNetworkName() external view returns (string memory);
    function getChainId() external view returns (uint256);
}
