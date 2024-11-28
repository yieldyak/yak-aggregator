// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.0;

interface ITMMarket {
    function getFactory() external pure returns (address);

    function getBaseToken() external pure returns (address);

    function getQuoteToken() external pure returns (address);

    function getDeltaAmounts(int256 deltaAmount, bool swapB2Q)
        external
        view
        returns (int256 deltaBaseAmount, int256 deltaQuoteAmount, uint256 quoteFees);

    function swap(address recipient, int256 deltaAmount, bool swapB2Q, bytes calldata data, address referrer)
        external
        returns (int256 deltaBaseAmount, int256 deltaQuoteAmount);
}
