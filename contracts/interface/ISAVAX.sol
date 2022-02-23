// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0;

import "./IERC20.sol";

interface ISAVAX is IERC20 {
    function getSharesByPooledAvax(uint) external view returns (uint);
    function submit() external payable returns (uint);
    function mintingPaused() external view returns (bool);
    function totalPooledAvax() external view returns (uint);
    function totalPooledAvaxCap() external view returns (uint);
}