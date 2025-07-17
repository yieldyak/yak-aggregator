// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface ICurvePlain128Native {
    function coins(uint256 index) external view returns (address);

    function exchange(
        int128 tokenIndexFrom,
        int128 tokenIndexTo,
        uint256 dx,
        uint256 minDy
    ) external payable returns (uint256);

    function get_dy(
        int128 tokenIndexFrom,
        int128 tokenIndexTo,
        uint256 dx
    ) external view returns (uint256);
}
