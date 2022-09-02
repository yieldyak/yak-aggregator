// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IWooPP {
    function quoteToken() external view returns (address);

    function querySellQuote(address, uint256) external view returns (uint256);

    function querySellBase(address, uint256) external view returns (uint256);

    function sellBase(
        address baseToken,
        uint256 baseAmount,
        uint256 minQuoteAmount,
        address to,
        address rebateTo
    ) external returns (uint256 quoteAmount);

    function sellQuote(
        address baseToken,
        uint256 quoteAmount,
        uint256 minBaseAmount,
        address to,
        address rebateTo
    ) external returns (uint256 baseAmount);
}
