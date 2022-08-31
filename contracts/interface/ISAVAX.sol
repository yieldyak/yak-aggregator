// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./IERC20.sol";

interface ISAVAX is IERC20 {
    function getSharesByPooledAvax(uint256) external view returns (uint256);

    function submit() external payable returns (uint256);

    function mintingPaused() external view returns (bool);

    function totalPooledAvax() external view returns (uint256);

    function totalPooledAvaxCap() external view returns (uint256);
}
