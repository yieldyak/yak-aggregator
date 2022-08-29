// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0;

interface ICurveMim {
    function underlying_coins(uint256 index) external view returns (address);

    function coins(uint256 index) external view returns (address);

    function get_dy_underlying(
        int128 tokenIndexFrom,
        int128 tokenIndexTo,
        uint256 dx
    ) external view returns (uint256);

    function exchange_underlying(
        address pool,
        int128 tokenIndexFrom,
        int128 tokenIndexTo,
        uint256 dx,
        uint256 minDy
    ) external;
}
