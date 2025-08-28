// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.0;

import {Test} from "forge-std/Test.sol";
import {YakAdapter} from "../src/YakAdapter.sol";
import {IERC20} from "../src/interface/IERC20.sol";

contract AdapterTestBase is Test {
    struct SwapOption {
        uint256 amountIn;
        address tokenFrom;
        address tokenTo;
    }

    /**
     * @dev Generic test that verifies swap output matches query result
     * @param adapter The adapter instance to test
     * @param tokenIn Input token address
     * @param tokenOut Output token address
     * @param amountIn Amount of input tokens
     * @param tolerance Tolerance for output comparison (e.g., 0.01e18 for 1%)
     */
    function assertSwapMatchesQuery(
        YakAdapter adapter,
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 tolerance
    ) internal {
        // Deal input tokens to this test contract
        deal(tokenIn, address(this), amountIn);

        // Query expected output
        uint256 expectedOut = adapter.query(amountIn, tokenIn, tokenOut);

        assertGt(expectedOut, 0, "Query should return non-zero amount");

        // Transfer tokens to adapter
        IERC20(tokenIn).transfer(address(adapter), amountIn);

        // Execute swap
        adapter.swap(amountIn, expectedOut, tokenIn, tokenOut, address(this));

        // Assert output matches query within tolerance
        uint256 actualOut = IERC20(tokenOut).balanceOf(address(this));
        assertApproxEqRel(actualOut, expectedOut, tolerance);
    }

    /**
     * @dev Simplified version with default 1% tolerance
     */
    function assertSwapMatchesQuery(YakAdapter adapter, address tokenIn, address tokenOut, uint256 amountIn) internal {
        assertSwapMatchesQuery(adapter, tokenIn, tokenOut, amountIn, 0.01e18);
    }

    function assertSwapFails(YakAdapter adapter, address tokenIn, address tokenOut, uint256 amountIn) internal {
        // Deal input tokens to this test contract
        deal(tokenIn, address(this), amountIn);

        // Query expected output
        uint256 expectedOut = adapter.query(amountIn, tokenIn, tokenOut);

        // Transfer tokens to adapter
        IERC20(tokenIn).transfer(address(adapter), amountIn);

        // Execute swap
        vm.expectRevert();
        adapter.swap(amountIn, expectedOut, tokenIn, tokenOut, address(this));
    }

    /**
     * @dev Test that queries return zero for unsupported tokens
     * @param adapter The adapter instance to test
     * @param supportedToken A token that the adapter supports
     */
    function assertQueryReturnsZeroForUnsupportedTokens(YakAdapter adapter, address supportedToken) internal view {
        uint256 amountIn = 1e6; // 1 token with 6 decimals
        address unsupportedToken = address(0); // Use address zero as unsupported token

        // Query with unsupported tokenIn should return 0
        uint256 result1 = adapter.query(amountIn, unsupportedToken, supportedToken);
        assertEq(result1, 0, "Query should return 0 for unsupported tokenIn");

        // Query with unsupported tokenOut should return 0
        uint256 result2 = adapter.query(amountIn, supportedToken, unsupportedToken);
        assertEq(result2, 0, "Query should return 0 for unsupported tokenOut");
    }

    function assertQueryReturnsZero(YakAdapter adapter, address tokenIn, address tokenOut, uint256 amountIn)
        internal
        view
    {
        uint256 result = adapter.query(amountIn, tokenIn, tokenOut);
        assertEq(result, 0, "Query should return 0 for unsupported pair");
    }

    /**
     * @dev Test that gas estimate is sensible compared to actual gas usage
     * @param adapter The adapter instance to test
     * @param options Array of swap options to test
     * @param accuracyPct Accuracy percentage (default 10%)
     */
    function assertGasEstimateIsSensible(YakAdapter adapter, SwapOption[] memory options, uint256 accuracyPct)
        internal
    {
        uint256 maxGas = 0;

        for (uint256 i = 0; i < options.length; i++) {
            SwapOption memory option = options[i];

            // Measure gas used for this swap
            uint256 gasUsed = _getGasEstimateForSwapAndQuery(adapter, option.amountIn, option.tokenFrom, option.tokenTo);

            if (gasUsed > maxGas) {
                maxGas = gasUsed;
            }
        }

        uint256 adapterGasEstimate = adapter.swapGasEstimate();
        uint256 upperBoundary = maxGas * (100 + accuracyPct) / 100;

        assertGe(adapterGasEstimate, maxGas, "Gas estimate should be at least max actual gas");
        assertLe(adapterGasEstimate, upperBoundary, "Gas estimate should not exceed max gas + accuracy percentage");
    }

    /**
     * @dev Simplified version with default 10% accuracy
     */
    function assertGasEstimateIsSensible(YakAdapter adapter, SwapOption[] memory options) internal {
        assertGasEstimateIsSensible(adapter, options, 10);
    }

    /**
     * @dev Measure gas used for a swap operation
     */
    function _getGasEstimateForSwapAndQuery(YakAdapter adapter, uint256 amountIn, address tokenFrom, address tokenTo)
        internal
        returns (uint256)
    {
        // Deal tokens
        deal(tokenFrom, address(this), amountIn);

        // Query expected output
        uint256 expectedOut = adapter.query(amountIn, tokenFrom, tokenTo);

        // Skip if query returns 0 (unsupported pair)
        if (expectedOut == 0) {
            return 0;
        }

        // Transfer tokens to adapter
        IERC20(tokenFrom).transfer(address(adapter), amountIn);

        // Measure gas for swap
        uint256 gasStart = gasleft();
        adapter.swap(amountIn, expectedOut, tokenFrom, tokenTo, address(this));
        uint256 gasUsed = gasStart - gasleft();

        return gasUsed;
    }
}
