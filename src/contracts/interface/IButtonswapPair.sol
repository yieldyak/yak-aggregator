// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.4;

// https://github.com/buttonwood-protocol/buttonswap-core/blob/main/src/interfaces/IButtonswapPair/IButtonswapPair.sol
interface IButtonswapPair {
    /**
     * @notice Get the current liquidity values.
     * @return _pool0 The active `token0` liquidity
     * @return _pool1 The active `token1` liquidity
     * @return _reservoir0 The inactive `token0` liquidity
     * @return _reservoir1 The inactive `token1` liquidity
     * @return _blockTimestampLast The timestamp of when the price was last updated
     */
    function getLiquidityBalances()
        external
        view
        returns (
            uint112 _pool0,
            uint112 _pool1,
            uint112 _reservoir0,
            uint112 _reservoir1,
            uint32 _blockTimestampLast
        );

    /**
     * @notice Swaps one token for the other, taking `amountIn0` of `token0` and `amountIn1` of `token1` from the sender and sending `amountOut0` of `token0` and `amountOut1` of `token1` to `to`.
     * The price of the swap is determined by maintaining the "K Invariant".
     * A 0.3% fee is collected to distribute between liquidity providers and the protocol.
     * @dev The token deposits are deduced to be the delta between the current Pair contract token balances and the last stored balances.
     * Optional calldata can be passed to `data`, which will be used to confirm the output token transfer with `to` if `to` is a contract that implements the {IButtonswapCallee} interface.
     * Refer to [swap-math.md](https://github.com/buttonwood-protocol/buttonswap-core/blob/main/notes/swap-math.md) for more detail.
     * @param amountIn0 The amount of `token0` that the sender sends
     * @param amountIn1 The amount of `token1` that the sender sends
     * @param amountOut0 The amount of `token0` that the recipient receives
     * @param amountOut1 The amount of `token1` that the recipient receives
     * @param to The account that receives the swap output
     */
    function swap(
        uint256 amountIn0,
        uint256 amountIn1,
        uint256 amountOut0,
        uint256 amountOut1,
        address to
    ) external;
}
