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

}