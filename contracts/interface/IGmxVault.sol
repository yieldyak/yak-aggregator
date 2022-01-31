pragma solidity >=0.7.0;

interface IGmxVaultPriceFeed {
    function getPrice(address,bool,bool,bool) external view returns (uint);
}

interface IGmxVaultUtils {
    function getSwapFeeBasisPoints(address,address,uint256) external view returns (uint);
}

interface IGmxVault {

    function swap(address,address,address) external;
    function whitelistedTokens(address) external view returns (bool);
    function isSwapEnabled() external view returns (bool);
    function vaultUtils() external view returns (IGmxVaultUtils);
    function priceFeed() external view returns (IGmxVaultPriceFeed);
    function allWhitelistedTokensLength() external view returns (uint);
    function allWhitelistedTokens(uint) external view returns (address);
    function maxUsdgAmounts(address) external view returns (uint);
    function usdgAmounts(address) external view returns (uint);
    function reservedAmounts(address) external view returns (uint);
    function bufferAmounts(address) external view returns (uint);
    function poolAmounts(address) external view returns (uint);

    function setBufferAmount(address,uint) external;
    function gov() external view returns (address);


}