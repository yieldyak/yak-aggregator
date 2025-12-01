// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";

interface IUniswapV4StaticQuoter {
    struct QuoteExactInputSingleParams {
        PoolKey poolKey;
        bool zeroForOne;
        uint128 amountIn;
        uint160 sqrtPriceLimitX96;
        bytes hookData;
    }

    /// @notice Returns the amount out received for a given exact input swap
    /// @param params The parameters for the quote
    /// @return amountOut The amount of output token that would be received
    function quoteExactInputSingle(QuoteExactInputSingleParams memory params)
        external
        view
        returns (uint256 amountOut);
}

