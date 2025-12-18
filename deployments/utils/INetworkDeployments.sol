// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";

interface INetworkDeployments {
    function getRouter() external view returns (address);
    function getWhitelistedAdapters() external view returns (address[] memory);
    function getWhitelistedHopTokens() external view returns (address[] memory);
    function getNetworkName() external view returns (string memory);
    function getChainId() external view returns (uint256);
    function getUniswapV4Adapter() external view returns (address);
    function getWhitelistedUniswapV4Pools() external view returns (PoolKey[] memory);
}
