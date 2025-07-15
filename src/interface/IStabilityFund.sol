// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IStabilityFund {
    function swap(
        address token0,
        uint256 amount,
        address token1
    ) external;

    function swapEnabled() external view returns (bool);

    function isStableToken(address) external view returns (bool);

    function isTokenDisabled(address) external view returns (bool);

    function getStableTokens() external view returns (address[] memory);

    function getStableTokensCount() external view returns (uint256);

    function swapFee() external view returns (uint256);
}
