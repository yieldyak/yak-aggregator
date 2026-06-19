// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.0;

interface IChainlinkCcipStaking {
    function TOKEN() external view returns (address);
    function WNATIVE() external view returns (address);
    function getOraclePool() external view returns (address);
    function fastStake(address token, uint256 amount, uint256 minAmountOut) external payable returns (uint256 amountOut);
}

interface IChainlinkCcipOraclePool {
    function TOKEN_IN() external view returns (address);
    function TOKEN_OUT() external view returns (address);
    function getOracle() external view returns (address);
    function getFee() external view returns (uint96);
    function paused() external view returns (bool);
}

interface IChainlinkCcipOracle {
    function getLatestAnswer() external view returns (uint256);
}
