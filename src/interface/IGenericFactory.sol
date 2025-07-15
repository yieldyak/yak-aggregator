// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

interface IGenericFactory {
    function allPairs() external view returns (address[] memory);
    function getPair(address tokenA, address tokenB, uint256 curveId) external view returns (address);
}
