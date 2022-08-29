// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0;

interface IPlatypus {
    // Views
    function quotePotentialSwap(
        address fromToken,
        address totoken,
        uint256 fromAmount
    ) external view returns (uint256 potentialOutcome); // Second arg (haircut) is not used

    function getTokenAddresses() external view returns (address[] memory);

    function paused() external view returns (bool);

    // Modifiers
    function swap(
        address fromToken,
        address toToken,
        uint256 fromAmount,
        uint256 minAmountOut,
        address to,
        uint256 deadline
    ) external;

    function pause() external;

    function unpause() external;
}
