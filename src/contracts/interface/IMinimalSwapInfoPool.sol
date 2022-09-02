// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./IBasePool.sol";

interface IMinimalSwapInfoPool is IBasePool {
    function onSwap(
        SwapRequest memory swapRequest,
        uint256 currentBalanceTokenIn,
        uint256 currentBalanceTokenOut
    ) external view returns (uint256 amount);
}
