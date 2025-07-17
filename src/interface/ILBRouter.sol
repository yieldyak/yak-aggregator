// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface ILBRouter {
    function factory() external view returns (address);

    function getSwapOut(
        address pair,
        uint256 amountIn,
        bool swapForY
    ) external view returns (uint256 amountOut, uint256 feesIn);

    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        uint256[] memory pairBinSteps,
        address[] memory tokenPath,
        address to,
        uint256 deadline
    ) external returns (uint256 amountOut);
}
