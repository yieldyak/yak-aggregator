// SPDX-License-Identifier: Business Source License 1.1
pragma solidity ^0.8.19;

interface ICavalReMultiswapBasePool {

    function assetAddresses() external view returns (address[] memory);

    function quoteSwap(
        address payToken,
        address receiveToken,
        uint256 payAmount
    ) external returns (uint256 receiveAmount, uint256 feeAmount);

    function swap(
        address payToken,
        address receiveToken,
        uint256 payAmount,
        uint256 minReceiveAmount
    ) external returns (uint256 receiveAmount, uint256 feeAmount);

}
