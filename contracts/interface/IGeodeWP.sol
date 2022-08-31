// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IGeodeWP {
    function paused() external view returns (bool);

    function getDebt() external view returns (uint256);

    function getToken() external view returns (uint256);

    function getERC1155() external view returns (address);

    function getTokenBalance(uint8) external view returns (uint256);

    function calculateSwap(
        uint8 tokenIndexFrom,
        uint8 tokenIndexTo,
        uint256 dx
    ) external view returns (uint256);

    function swap(
        uint8 tokenIndexFrom,
        uint8 tokenIndexTo,
        uint256 dx,
        uint256 minDy,
        uint256 deadline
    ) external payable returns (uint256);

    function addLiquidity(
        uint256[] calldata amounts,
        uint256 minToMint,
        uint256 deadline
    ) external payable;
}
