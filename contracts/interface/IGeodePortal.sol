// SPDX-License-Identifier: MIT
pragma solidity >= 0.7.0;

interface IGeodePortal {

  function gAVAX() external view returns (address);
  function getNameFromId(uint256 _id) external view returns (bytes memory);
  function planetCurrentInterface(uint256 _id) external view returns (address);
  function planetWithdrawalPool(uint256 _id) external view returns (address);
  function getMaintainerFromId(uint256) external view returns (address);
  function isStakingPausedForPool(uint) external view returns (bool);

  function unpauseStakingForPool(uint) external;
  function pauseStakingForPool(uint) external;
  function stake(
    uint256 planetId,
    uint256 minGavax,
    uint256 deadline
  ) external payable returns (uint256 totalgAvax);
}