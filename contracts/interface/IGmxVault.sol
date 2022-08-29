// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0;

interface IGmxVaultPriceFeed {
    function getPrice(
        address,
        bool,
        bool,
        bool
    ) external view returns (uint256);
}

interface IGmxVaultUtils {
    function getSwapFeeBasisPoints(
        address,
        address,
        uint256
    ) external view returns (uint256);
}

interface IGmxVault {
    function swap(
        address,
        address,
        address
    ) external;

    function whitelistedTokens(address) external view returns (bool);

    function isSwapEnabled() external view returns (bool);

    function vaultUtils() external view returns (IGmxVaultUtils);

    function priceFeed() external view returns (IGmxVaultPriceFeed);

    function allWhitelistedTokensLength() external view returns (uint256);

    function allWhitelistedTokens(uint256) external view returns (address);

    function maxUsdgAmounts(address) external view returns (uint256);

    function usdgAmounts(address) external view returns (uint256);

    function reservedAmounts(address) external view returns (uint256);

    function bufferAmounts(address) external view returns (uint256);

    function poolAmounts(address) external view returns (uint256);

    function setBufferAmount(address, uint256) external;

    function gov() external view returns (address);
}
