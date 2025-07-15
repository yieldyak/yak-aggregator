// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.0;

interface ITMFactory {
    function getMarket(address tokenA, address tokenB) external view returns (bool tokenAisBase, address market);
}
