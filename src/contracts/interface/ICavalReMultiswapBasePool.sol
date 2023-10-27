// SPDX-License-Identifier: Business Source License 1.1
pragma solidity ^0.8.19;

struct PoolState {
    address token;
    string name;
    string symbol;
    uint8 decimals;
    int256 w;
    uint256 balance;
    uint256 meanBalance;
    uint256 scale;
    uint256 meanScale;
    uint256 lastUpdated;
}

struct AssetState {
    address token;
    uint256 index;
    string name;
    string symbol;
    uint8 decimals;
    uint256 conversion;
    uint256 fee;
    uint256 balance;
    uint256 meanBalance;
    uint256 scale;
    uint256 meanScale;
    uint256 lastUpdated;
}

interface ICavalReMultiswapBasePool {

    function info() external view returns (PoolState memory);

    function assets() external view returns (AssetState[] memory);

    function asset(address token) external view returns (AssetState memory);

    function protocolFee() external view returns (uint256);

    function multiswap(
        address[] memory payTokens,
        uint256[] memory amounts,
        address[] memory receiveTokens,
        uint256[] memory allocations,
        uint256[] memory minReceiveAmounts
    ) external returns (uint256[] memory receiveAmounts, uint256 feeAmount);

    function swap(
        address payToken,
        address receiveToken,
        uint256 payAmount,
        uint256 minReceiveAmount
    ) external returns (uint256 receiveAmount, uint256 feeAmount);

    function stake(
        address payToken,
        uint256 payAmount,
        uint256 minReceiveAmount
    ) external returns (uint256 receiveAmount, uint256 feeAmount);

    function unstake(
        address receiveToken,
        uint256 payAmount,
        uint256 minReceiveAmount
    ) external returns (uint256 receiveAmount, uint256 feeAmount);
}
