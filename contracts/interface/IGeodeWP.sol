// SPDX-License-Identifier: MIT
pragma solidity >= 0.7.0;

interface IGeodeWP {

  function paused() external view returns (bool);
  function getDebt() external view returns (uint);
  function getToken() external view returns (uint256);
  function getERC1155() external view returns (address);

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

}