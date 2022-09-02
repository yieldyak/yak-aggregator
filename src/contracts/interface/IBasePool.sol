// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./IPoolSwapStructs.sol";

interface IBasePool is IPoolSwapStructs {
    function getPoolId() external view returns (bytes32);
}
