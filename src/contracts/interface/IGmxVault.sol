// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IGmxVaultPriceFeed {
    function getPrice(address, bool, bool, bool) external view returns (uint256);
}

interface IGmxVaultUtils {
    function getSwapFeeBasisPoints(address, address, uint256) external view returns (uint256);

    function getBuyUsdgFeeBasisPoints(address _token, uint256 _usdgAmount) external view returns (uint256);

    function getSellUsdgFeeBasisPoints(address _token, uint256 _usdgAmount) external view returns (uint256);
}

interface IGmxVault {
    function swap(address, address, address) external;

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

    function usdg() external view returns (address);

    function hasDynamicFees() external view returns (bool);

    function stableTokens(address) external view returns (bool);

    function getFeeBasisPoints(address, uint256, uint256, uint256, bool) external view returns (uint256);

    function stableSwapFeeBasisPoints() external view returns (uint256);

    function swapFeeBasisPoints() external view returns (uint256);

    function stableTaxBasisPoints() external view returns (uint256);

    function taxBasisPoints() external view returns (uint256);

    function mintBurnFeeBasisPoints() external view returns (uint256);

    function setBufferAmount(address, uint256) external;

    function gov() external view returns (address);

    function getMaxPrice(address _token) external view returns (uint256);

    function getMinPrice(address _token) external view returns (uint256);

    function adjustForDecimals(uint256 _amount, address _tokenDiv, address _tokenMul) external view returns (uint256);

    function getRedemptionAmount(address _token, uint256 _usdgAmount) external view returns (uint256);

    function getTargetUsdgAmount(address _token) external view returns (uint256);
}
