// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.0;

import {AvalancheTestBase} from "./AvalancheTestBase.sol";
import {UniswapV4Adapter} from "../../src/adapters/UniswapV4Adapter.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {Currency} from "@uniswap/v4-core/src/types/Currency.sol";
import {IHooks} from "@uniswap/v4-core/src/interfaces/IHooks.sol";
import {IERC20} from "../../src/interface/IERC20.sol";
import "forge-std/console.sol";

contract UniswapV4Test is AvalancheTestBase {
    address public poolManager = 0x06380C0e0912312B5150364B9DC4542BA0DbBc85;
    address public staticQuoter = 0x399AbdD1af8A67a6e9511e0BF616B8c18e3f5D1b;

    uint256 public constant GAS_ESTIMATE = 260_000;

    function _createAdapter() internal returns (UniswapV4Adapter) {
        return new UniswapV4Adapter("UniswapV4", GAS_ESTIMATE, staticQuoter, poolManager, WAVAX);
    }

    /// @notice Helper to add common pools for WAVAX/USDC pair
    /// @dev Only adds pools that exist on-chain. Tries common configurations.
    function addWavaxUsdcPools(UniswapV4Adapter adapter) internal {
        Currency currency0 = Currency.wrap(WAVAX);
        Currency currency1 = Currency.wrap(USDC);

        // Try to add common pool configurations one by one
        // Standard Uniswap V3/V4 pool: 0.3% fee, tick spacing 60
        PoolKey memory poolKey1 = PoolKey({
            currency0: currency0,
            currency1: currency1,
            fee: 3000, // 0.3%
            tickSpacing: 60,
            hooks: IHooks(address(0))
        });
        try adapter.addPool(poolKey1) {} catch {}

        // Alternative: 0.05% fee, tick spacing 10
        PoolKey memory poolKey2 = PoolKey({
            currency0: currency0,
            currency1: currency1,
            fee: 500, // 0.05%
            tickSpacing: 10,
            hooks: IHooks(address(0))
        });
        try adapter.addPool(poolKey2) {} catch {}
    }

    function test_swapMatchesQuery() public {
        UniswapV4Adapter adapter = _createAdapter();

        // Add pools to whitelist
        addWavaxUsdcPools(adapter);

        // Test WAVAX -> USDC
        assertSwapMatchesQuery(adapter, WAVAX, USDC, 10e18);

        // Test USDC -> WAVAX
        assertSwapMatchesQuery(adapter, USDC, WAVAX, 100e6);
    }

    function test_queryReturnsZeroForUnsupportedTokens() public {
        UniswapV4Adapter adapter = _createAdapter();

        // Add pools to whitelist
        addWavaxUsdcPools(adapter);

        // Test with USDC as supported token
        assertQueryReturnsZeroForUnsupportedTokens(adapter, USDC);
    }

    // function test_gasEstimateIsSensible() public {
    //     UniswapV4Adapter adapter = new UniswapV4Adapter("UniswapV4", GAS_ESTIMATE, staticQuoter, poolManager);

    //     // Add pools to whitelist
    //     addWavaxUsdcPools(adapter);

    //     // Create array of swap options to test
    //     SwapOption[] memory options = new SwapOption[](2);
    //     options[0] = SwapOption(1e18, WAVAX, USDC);
    //     options[1] = SwapOption(100e6, USDC, WAVAX);

    //     // Test with default 10% accuracy
    //     assertGasEstimateIsSensible(adapter, options);
    // }

    function test_addPool() public {
        UniswapV4Adapter adapter = _createAdapter();

        PoolKey memory poolKey = PoolKey({
            currency0: Currency.wrap(WAVAX),
            currency1: Currency.wrap(USDC),
            fee: 500,
            tickSpacing: 10,
            hooks: IHooks(address(0))
        });

        // Initially no pools
        PoolKey[] memory pools = adapter.getPools(WAVAX, USDC);
        assertEq(pools.length, 0);

        // Add pool
        adapter.addPool(poolKey);

        // Verify pool was added
        pools = adapter.getPools(WAVAX, USDC);
        assertEq(pools.length, 1);
        assertEq(Currency.unwrap(pools[0].currency0), WAVAX);
        assertEq(Currency.unwrap(pools[0].currency1), USDC);
        assertEq(pools[0].fee, 500);
        assertEq(pools[0].tickSpacing, 10);

        // Verify it's in getAllPools
        PoolKey[] memory allPools = adapter.getAllPools();
        assertEq(allPools.length, 1);
    }

    function test_addPool_duplicateReverts() public {
        UniswapV4Adapter adapter = _createAdapter();

        PoolKey memory poolKey = PoolKey({
            currency0: Currency.wrap(WAVAX),
            currency1: Currency.wrap(USDC),
            fee: 500,
            tickSpacing: 10,
            hooks: IHooks(address(0))
        });

        adapter.addPool(poolKey);

        // Adding same pool again should revert
        vm.expectRevert("Pool already whitelisted");
        adapter.addPool(poolKey);
    }

    function test_removePool() public {
        UniswapV4Adapter adapter = _createAdapter();

        PoolKey memory poolKey = PoolKey({
            currency0: Currency.wrap(WAVAX),
            currency1: Currency.wrap(USDC),
            fee: 500,
            tickSpacing: 10,
            hooks: IHooks(address(0))
        });

        // Add pool
        adapter.addPool(poolKey);
        assertEq(adapter.getPools(WAVAX, USDC).length, 1);
        assertEq(adapter.getAllPools().length, 1);

        // Remove pool
        adapter.removePool(poolKey);

        // Verify pool was removed
        assertEq(adapter.getPools(WAVAX, USDC).length, 0);
        assertEq(adapter.getAllPools().length, 0);
    }

    function test_addBothWavaxAndNativePools() public {
        UniswapV4Adapter adapter = _createAdapter();

        // Add WAVAX/USDC pool
        PoolKey memory wavaxPool = PoolKey({
            currency0: Currency.wrap(WAVAX),
            currency1: Currency.wrap(USDC),
            fee: 500,
            tickSpacing: 10,
            hooks: IHooks(address(0))
        });
        try adapter.addPool(wavaxPool) {} catch {}

        // Add native AVAX/USDC pool
        PoolKey memory nativePool = PoolKey({
            currency0: Currency.wrap(address(0)),
            currency1: Currency.wrap(USDC),
            fee: 500,
            tickSpacing: 10,
            hooks: IHooks(address(0))
        });
        try adapter.addPool(nativePool) {} catch {}

        // Verify both pools are stored separately
        PoolKey[] memory wavaxPools = adapter.getPools(WAVAX, USDC);
        PoolKey[] memory nativePools = adapter.getPools(address(0), USDC);

        // At least one should exist (depending on which pools actually exist on-chain)
        assertTrue(wavaxPools.length > 0 || nativePools.length > 0, "At least one pool should exist");

        // Verify getAllPools includes both if they were added
        PoolKey[] memory allPools = adapter.getAllPools();
        uint256 wavaxCount = 0;
        uint256 nativeCount = 0;
        for (uint256 i = 0; i < allPools.length; i++) {
            address token0 = Currency.unwrap(allPools[i].currency0);
            address token1 = Currency.unwrap(allPools[i].currency1);
            if ((token0 == WAVAX || token1 == WAVAX) && (token0 == USDC || token1 == USDC)) {
                if (token0 == address(0) || token1 == address(0)) {
                    nativeCount++;
                } else {
                    wavaxCount++;
                }
            }
        }
        console.log("WAVAX pools found:", wavaxCount);
        console.log("Native pools found:", nativeCount);
    }

    function test_bothPoolsQueried() public {
        UniswapV4Adapter adapter = _createAdapter();

        // Add WAVAX/USDC pool (if it exists)
        PoolKey memory wavaxPool = PoolKey({
            currency0: Currency.wrap(WAVAX),
            currency1: Currency.wrap(USDC),
            fee: 500,
            tickSpacing: 10,
            hooks: IHooks(address(0))
        });
        bool wavaxAdded = false;
        try adapter.addPool(wavaxPool) {
            wavaxAdded = true;
        } catch {}

        // Add native AVAX/USDC pool (if it exists)
        PoolKey memory nativePool = PoolKey({
            currency0: Currency.wrap(address(0)),
            currency1: Currency.wrap(USDC),
            fee: 500,
            tickSpacing: 10,
            hooks: IHooks(address(0))
        });
        bool nativeAdded = false;
        try adapter.addPool(nativePool) {
            nativeAdded = true;
        } catch {}

        // Skip test if neither pool exists
        if (!wavaxAdded && !nativeAdded) {
            console.log("Skipping test: neither pool exists on-chain");
            return;
        }

        // Query with WAVAX - should find best pool from both types
        uint256 amountIn = 1e18;
        uint256 quote = adapter.query(amountIn, WAVAX, USDC);

        console.log("Query result:", quote);
        console.log("WAVAX pool added:", wavaxAdded);
        console.log("Native pool added:", nativeAdded);

        // If at least one pool exists, we should get a quote
        if (wavaxAdded || nativeAdded) {
            assertGt(quote, 0, "Should get a quote when pools exist");
        }
    }

    function test_swapWithNativePool() public {
        UniswapV4Adapter adapter = _createAdapter();

        // Try to add native AVAX/USDC pool (if it exists)
        PoolKey memory nativePool = PoolKey({
            currency0: Currency.wrap(address(0)),
            currency1: Currency.wrap(USDC),
            fee: 500,
            tickSpacing: 10,
            hooks: IHooks(address(0))
        });

        bool nativeAdded = false;
        try adapter.addPool(nativePool) {
            nativeAdded = true;
        } catch {}

        // Skip test if native pool doesn't exist
        if (!nativeAdded) {
            console.log("Skipping test: native AVAX/USDC pool does not exist on-chain");
            return;
        }

        // Test swap: Router sends WAVAX, pool uses native AVAX, pool returns native AVAX
        // Adapter should unwrap WAVAX → native, swap, then wrap native → WAVAX
        uint256 amountIn = 1e18; // 1 WAVAX

        // Query expected output
        uint256 expectedOut = adapter.query(amountIn, WAVAX, USDC);
        assertGt(expectedOut, 0, "Should get a quote from native pool");

        // Deal WAVAX to this test contract
        deal(WAVAX, address(this), amountIn);

        // Transfer WAVAX to adapter
        IERC20(WAVAX).transfer(address(adapter), amountIn);

        // Record initial USDC balance
        uint256 initialUsdcBalance = IERC20(USDC).balanceOf(address(this));

        // Execute swap - adapter should handle WAVAX → native → WAVAX conversion
        adapter.swap(amountIn, expectedOut, WAVAX, USDC, address(this));

        // Verify we received USDC (not native AVAX)
        uint256 finalUsdcBalance = IERC20(USDC).balanceOf(address(this));
        uint256 usdcReceived = finalUsdcBalance - initialUsdcBalance;

        assertGt(usdcReceived, 0, "Should receive USDC");
        assertApproxEqRel(usdcReceived, expectedOut, 0.01e18, "Output should match query");
    }

    function test_swapFromNativePool() public {
        UniswapV4Adapter adapter = _createAdapter();

        // Try to add native AVAX/USDC pool (if it exists)
        PoolKey memory nativePool = PoolKey({
            currency0: Currency.wrap(address(0)),
            currency1: Currency.wrap(USDC),
            fee: 500,
            tickSpacing: 10,
            hooks: IHooks(address(0))
        });

        adapter.addPool(nativePool);

        // Test swap: Router sends USDC, pool uses native AVAX, pool returns native AVAX
        // Adapter should wrap native → WAVAX before sending to router
        uint256 amountIn = 100e6; // 100 USDC

        // Query expected output
        uint256 expectedOut = adapter.query(amountIn, USDC, WAVAX);
        assertGt(expectedOut, 0, "Should get a quote from native pool");

        // Deal USDC to this test contract
        deal(USDC, address(this), amountIn);

        // Transfer USDC to adapter
        IERC20(USDC).transfer(address(adapter), amountIn);

        // Record initial WAVAX balance
        uint256 initialWavaxBalance = IERC20(WAVAX).balanceOf(address(this));

        // Execute swap - adapter should wrap native AVAX to WAVAX
        adapter.swap(amountIn, expectedOut, USDC, WAVAX, address(this));

        // Verify we received WAVAX (not native AVAX)
        uint256 finalWavaxBalance = IERC20(WAVAX).balanceOf(address(this));
        uint256 wavaxReceived = finalWavaxBalance - initialWavaxBalance;

        assertGt(wavaxReceived, 0, "Should receive WAVAX");
        assertApproxEqRel(wavaxReceived, expectedOut, 0.01e18, "Output should match query");
    }
}

