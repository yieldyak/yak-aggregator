// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IDodoV2 {
    function _QUOTE_TOKEN_() external view returns (address);

    function _BASE_TOKEN_() external view returns (address);

    function querySellBase(address trader, uint256 payBaseAmount) external view returns (uint256 receiveQuoteAmount);

    function querySellQuote(address trader, uint256 payQuoteAmount) external view returns (uint256 receiveBaseAmount);

    function sellBase(address to) external returns (uint256 receiveQuoteAmount);

    function sellQuote(address to) external returns (uint256 receiveBaseAmount);
}
