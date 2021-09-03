// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0;

import "./IERC20.sol";

interface ISynapse {
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
}