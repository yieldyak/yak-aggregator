// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface ICurvePlain256 {
    function coins(uint256 index) external view returns (address);

    function exchange(
        uint256 tokenIndexFrom,
        uint256 tokenIndexTo,
        uint256 dx,
        uint256 minDy
    ) external;

    function get_dy(
        uint256 tokenIndexFrom,
        uint256 tokenIndexTo,
        uint256 dx
    ) external view returns (uint256);
}
