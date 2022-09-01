// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface ICurve1 {
    function underlying_coins(uint256 index) external view returns (address);

    function exchange_underlying(
        uint256 tokenIndexFrom,
        uint256 tokenIndexTo,
        uint256 dx,
        uint256 minDy
    ) external;

    function get_dy_underlying(
        uint256 tokenIndexFrom,
        uint256 tokenIndexTo,
        uint256 dx
    ) external view returns (uint256);
}
