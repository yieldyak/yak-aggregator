// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0;

interface IPlatypus {

    // Views
    function quotePotentialSwap(
        address fromToken, 
        address totoken, 
        uint fromAmount
    ) external view returns (uint potentialOutcome);  // Second arg (haircut) is not used
    function getTokenAddresses() external view returns (address[] memory);
    function paused() external view returns (bool);

    // Modifiers
    function swap(
        address fromToken,
        address toToken,
        uint fromAmount,
        uint minAmountOut, 
        address to,
        uint deadline
    ) external;
    function pause() external;
    function unpause() external;

}


