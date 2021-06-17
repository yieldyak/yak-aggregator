// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0;

import "./IERC20.sol";

interface ICurveLikePool {
    function getTokenIndex(address tokenAddress) external view returns (uint8);
    function getTokenBalance(uint8 index) external view returns (uint256);
    function getToken(uint8 index) external view returns (IERC20);
    function getVirtualPrice() external view returns (uint256);
    function owner() external view returns (address);
    function paused() external view returns (bool);
    function calculateSwap(
        uint8 tokenIndexFrom,
        uint8 tokenIndexTo,
        uint256 dx
    ) external view returns (uint256);
    function unpause() external;
    function pause() external;
    function swap(
        uint8 tokenIndexFrom,
        uint8 tokenIndexTo,
        uint256 dx,
        uint256 minDy,
        uint256 deadline
    ) external returns (uint256);
}