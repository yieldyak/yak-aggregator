// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./IERC20.sol";

struct SwapStorage {
    uint256 initialA;
    uint256 futureA;
    uint256 initialATime;
    uint256 futureATime;
    uint256 swapFee;
    uint256 adminFee;
    address lpToken;
}

interface ISaddleMeta {
    function getToken(uint8 index) external view returns (address);

    function getVirtualPrice() external view returns (uint256);

    function owner() external view returns (address);

    function paused() external view returns (bool);

    function calculateSwapUnderlying(
        uint8 tokenIndexFrom,
        uint8 tokenIndexTo,
        uint256 dx
    ) external view returns (uint256);

    function unpause() external;

    function pause() external;

    function swapUnderlying(
        uint8 tokenIndexFrom,
        uint8 tokenIndexTo,
        uint256 dx,
        uint256 minDy,
        uint256 deadline
    ) external returns (uint256);

    function metaSwapStorage() external returns (address);

    function swapStorage() external returns (SwapStorage memory);
}
