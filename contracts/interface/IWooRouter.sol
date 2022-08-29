// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

interface IWooRouter {
    function querySwap(
        address fromToken,
        address toToken,
        uint256 fromAmount
    ) external view returns (uint256 toAmount);

    function swap(
        address fromToken,
        address toToken,
        uint256 fromAmount,
        uint256 minToAmount,
        address payable to,
        address rebateTo
    ) external payable returns (uint256 realToAmount);
}
