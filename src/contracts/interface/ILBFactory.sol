// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface ILBFactory {
    struct LBPairInformation {
        uint24 binStep;
        address LBPair;
        bool createdByOwner;
        bool ignoredForRouting;
    }

    function getAllLBPairs(address tokenX, address tokenY)
        external
        view
        returns (LBPairInformation[] memory LBPairsBinStep);
}
