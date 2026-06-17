// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./utils/INetworkDeployments.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";

contract BaseDeployments is INetworkDeployments {
    // Chain ID
    uint256 constant CHAIN_ID = 8453;

    // Router
    address constant ROUTER = 0x50564bF9cE3b1eA33c7bDb5acfFb1B997C319aE4;
    address constant SIMPLE_ROUTER = 0xD7A465165338B0B53dfDdef2Ee07cd8870Cd7dc7;

    // Adapter addresses
    address constant AERODROME_ADAPTER = 0xfA89A3215C6f28fFcb96b4ae14557b1b6F60b67a;
    address constant AERODROME_CL_ADAPTER = 0xab7FFA7b7c18E36c3c7180D09E8d532136b2a776;
    address constant UNISWAP_V3_ADAPTER = 0xaf9024Cd85864C985f185F1A125f7Aae69e298f6;
    address constant UNISWAP_V2_ADAPTER = 0x91739fA321D12208dB61DF388C69372b658d725b;
    address constant PANCAKESWAP_V3_ADAPTER = 0x43595883bb86862805ABFb2D4A928559Ab4aE1B1;
    address constant WNATIVE_ADAPTER = 0x22a6Aa322645B881c3BD36AE03525684b5C91919;

    // Hop tokens
    address constant WETH = 0x4200000000000000000000000000000000000006;
    address constant USDC = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;
    address constant cbBTC = 0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf;
    address constant USDT = 0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2;

    function getChainId() public pure override returns (uint256) {
        return CHAIN_ID;
    }

    function getNetworkName() public pure override returns (string memory) {
        return "Base";
    }

    function getRouter() public pure override returns (address) {
        return ROUTER;
    }

    function getWhitelistedAdapters() public pure override returns (address[] memory) {
        address[] memory adapters = new address[](6);
        adapters[0] = AERODROME_ADAPTER;
        adapters[1] = AERODROME_CL_ADAPTER;
        adapters[2] = UNISWAP_V3_ADAPTER;
        adapters[3] = UNISWAP_V2_ADAPTER;
        adapters[4] = PANCAKESWAP_V3_ADAPTER;
        adapters[5] = WNATIVE_ADAPTER;
        return adapters;
    }

    function getWhitelistedHopTokens() public pure override returns (address[] memory) {
        address[] memory hopTokens = new address[](4);
        hopTokens[0] = WETH;
        hopTokens[1] = USDC;
        hopTokens[2] = cbBTC;
        hopTokens[3] = USDT;
        return hopTokens;
    }

    function getUniswapV4Adapter() public pure override returns (address) {
        return address(0);
    }

    function getWhitelistedUniswapV4Pools() public pure override returns (PoolKey[] memory) {
        return new PoolKey[](0);
    }
}
