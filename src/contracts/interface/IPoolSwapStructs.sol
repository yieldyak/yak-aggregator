// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./IVault.sol";

interface IPoolSwapStructs {
    struct SwapRequest {
        IVault.SwapKind kind;
        IERC20 tokenIn;
        IERC20 tokenOut;
        uint256 amount;
        bytes32 poolId;
        uint256 lastChangeBlock;
        address from;
        address to;
        bytes userData;
    }
}
