// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IDodoHelper {
    function querySellQuoteToken(address dodo, uint256 amount) external view returns (uint256);
}

interface IDodoV1 {
    function _QUOTE_TOKEN_() external view returns (address);

    function _BASE_TOKEN_() external view returns (address);

    function querySellBaseToken(uint256 amount) external view returns (uint256);

    function queryBuyBaseToken(uint256 amount) external view returns (uint256);

    function sellBaseToken(
        uint256 amount,
        uint256 minReceiveQuote,
        bytes calldata data
    ) external returns (uint256);

    function buyBaseToken(
        uint256 amount,
        uint256 maxPayQuote,
        bytes calldata data
    ) external returns (uint256);
}
