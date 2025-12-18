// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./utils/INetworkDeployments.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {Currency} from "@uniswap/v4-core/src/types/Currency.sol";
import {IHooks} from "@uniswap/v4-core/src/interfaces/IHooks.sol";

contract AvalancheDeployments is INetworkDeployments {
    // Chain ID
    uint256 constant CHAIN_ID = 43114;

    // Router
    address constant ROUTER = 0xC4729E56b831d74bBc18797e0e17A295fA77488c;

    // Adapter addresses
    address constant TRADER_JOE_YAK_ADAPTER = 0xDB66686Ac8bEA67400CF9E5DD6c8849575B90148;
    address constant PANGOLIN_YAK_ADAPTER = 0x3614657EDc3cb90BA420E5f4F61679777e4974E3;
    address constant SUSHI_YAK_ADAPTER = 0x3f314530a4964acCA1f20dad2D35275C23Ed7F5d;
    address constant PHARAOH_LEGACY_ADAPTER = 0x564C35a1647ED40850325eBf23e484bB56E75aB2;
    address constant SYNAPSE_PLAIN_YAK_ADAPTER = 0xaFb5aE9934266a131F44F2A80c783d6a827A3d1a;
    address constant CURVE_3POOL_V2_ADAPTER = 0xd0f6e66113A6D6Cca238371948F4Ce2893D62881;
    address constant CURVE_USDC_ADAPTER = 0x22c62c9E409B97F1f9caA5Ca5433074914d73c3e;
    address constant CURVE_YUSD_ADAPTER = 0x3EeA1f1fFCA00c69bA5a99E362D9A7d4e3902B3c;
    address constant UNISWAP_V3_ADAPTER = 0x29deCcD2f4Fdb046D24585d01B1DcDFb902ACAcD;
    address constant LIQUIDITY_BOOK_2_ADAPTER = 0xb94187369171f12ae28e08424BBD01424f13c659;
    address constant LIQUIDITY_BOOK_2_2_ADAPTER = 0xf9F824576F06fF92765f2Af700a5A9923526261e;
    address constant WOOFI_V2_ADAPTER = 0x4efB1880Dc9B01c833a6E2824C8EadeA83E428B0;
    address constant S_AVAX_ADAPTER = 0x2F6ca0a98CF8f7D407E98993fD576f70F0FAA80B;
    address constant WAVAX_ADAPTER = 0x5C4d23fd18Fc4128f77426F42237acFcE618D0b1;
    address constant WOMBAT_ADAPTER = 0x7De32C76309aeB1025CBA3384caBe36326603046;
    address constant PHARAOH_ADAPTER = 0x97d26D7fc0895e3456b2146585848b466cfbb1cf;
    address constant GG_AVAX_ADAPTER = 0x79632b8194a1Ce048e5d9b0e282E9eE2d4579c20;
    address constant TOKEN_MILL_ADAPTER = 0x214617987145Ef7c5462870362FdCAe9cacdf3C8;
    address constant ARENA_ADAPTER = 0xDfd22ef6D509a982F4e6883CBf00d56d5d0D87F3;
    address constant BLACKHOLE_ADAPTER = 0x123577a1560004D4432DC5e31F97363d0cD8A651;
    address constant BLACKHOLE_CLA_ADAPTER = 0xE3D2c10C2122e6f02C702064015554D468B24D6D;
    address constant PANGOLIN_V3_ADAPTER = 0x526C75aef80D3c5D19F1B9fC38e3f7EF591eaAA2;
    address constant APEX_ADAPTER = 0xA2b61cD3e656e22A41a290092eBe9a2f81ED39c5;
    address constant PHAR_CL_ADAPTER = 0xadDB698A6723787624f3286369E588De7D780927;
    address constant PHAR_LEGACY_ADAPTER = 0x20A8a786375E9A92B875AdD32a7280a32820682c;
    address constant ARENA_ADAPTER_V2 = 0xeF3CCEFb2FE23E9d0AA7B578724B92F59F76f13C;
    address constant UNISWAP_V4_ADAPTER = 0x030b6d2B19A834535987f20Ca2958039b572694C;

    // Hop tokens
    address constant WAVAX = 0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7;
    address constant WETHe = 0x49D5c2BdFfac6CE2BFdB6640F4F80f226bc10bAB;
    address constant USDTe = 0xc7198437980c041c805A1EDcbA50c1Ce5db95118;
    address constant USDCe = 0xA7D7079b0FEaD91F3e65f86E8915Cb59c1a4C664;
    address constant USDC = 0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E;
    address constant USDt = 0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7;
    address constant BTCb = 0x152b9d0FdC40C096757F570A51E494bd4b943E50;
    address constant BLACK = 0xcd94a87696FAC69Edae3a70fE5725307Ae1c43f6;
    address constant ARENA = 0xB8d7710f7d8349A506b75dD184F05777c82dAd0C;

    function getChainId() public pure override returns (uint256) {
        return CHAIN_ID;
    }

    function getNetworkName() public pure override returns (string memory) {
        return "Avalanche";
    }

    function getRouter() public pure override returns (address) {
        return ROUTER;
    }

    function getWhitelistedAdapters() public pure override returns (address[] memory) {
        address[] memory adapters = new address[](19);
        adapters[0] = TRADER_JOE_YAK_ADAPTER;
        adapters[1] = PANGOLIN_YAK_ADAPTER;
        adapters[2] = SUSHI_YAK_ADAPTER;
        adapters[3] = PHARAOH_LEGACY_ADAPTER;
        adapters[4] = UNISWAP_V3_ADAPTER;
        adapters[5] = LIQUIDITY_BOOK_2_ADAPTER;
        adapters[6] = LIQUIDITY_BOOK_2_2_ADAPTER;
        adapters[7] = WOOFI_V2_ADAPTER;
        adapters[8] = S_AVAX_ADAPTER;
        adapters[9] = WAVAX_ADAPTER;
        adapters[10] = PHARAOH_ADAPTER;
        adapters[11] = ARENA_ADAPTER;
        adapters[12] = BLACKHOLE_ADAPTER;
        adapters[13] = BLACKHOLE_CLA_ADAPTER;
        adapters[14] = PANGOLIN_V3_ADAPTER;
        adapters[15] = ARENA_ADAPTER_V2;
        adapters[16] = PHAR_CL_ADAPTER;
        adapters[17] = PHAR_LEGACY_ADAPTER;
        adapters[18] = UNISWAP_V4_ADAPTER;
        return adapters;
    }

    function getWhitelistedHopTokens() public pure override returns (address[] memory) {
        address[] memory hopTokens = new address[](7);
        hopTokens[0] = WAVAX;
        hopTokens[1] = WETHe;
        hopTokens[2] = USDC;
        hopTokens[3] = USDt;
        hopTokens[4] = BTCb;
        hopTokens[5] = BLACK;
        hopTokens[6] = ARENA;
        return hopTokens;
    }

    function getUniswapV4Adapter() public pure override returns (address) {
        return UNISWAP_V4_ADAPTER;
    }

    function getWhitelistedUniswapV4Pools() public pure override returns (PoolKey[] memory) {
        // Common pools for WAVAX/USDC pair
        // Standard Uniswap V3/V4 pool: 0.3% fee, tick spacing 60
        PoolKey[] memory pools = new PoolKey[](3);
        pools[0] = PoolKey({
            currency0: Currency.wrap(address(0)),
            currency1: Currency.wrap(USDC),
            fee: 3000, // 0.3%
            tickSpacing: 60,
            hooks: IHooks(address(0))
        });
        pools[1] = PoolKey({
            currency0: Currency.wrap(address(0)),
            currency1: Currency.wrap(USDC),
            fee: 500, // 0.05%
            tickSpacing: 10,
            hooks: IHooks(address(0))
        });
        pools[2] = PoolKey({
            currency0: Currency.wrap(USDt),
            currency1: Currency.wrap(USDC),
            fee: 3000, // 0.3%
            tickSpacing: 60,
            hooks: IHooks(address(0))
        });
        return pools;
    }
}
