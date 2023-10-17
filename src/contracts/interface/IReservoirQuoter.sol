// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

interface IQuoter {
    /// @dev aPath array of ERC20 tokens to swap into
    function getAmountsOut(uint256 aAmountIn, address[] calldata aPath, uint256[] calldata aCurveIds)
        external
        view
        returns (uint256[] memory rAmountsOut);
}
