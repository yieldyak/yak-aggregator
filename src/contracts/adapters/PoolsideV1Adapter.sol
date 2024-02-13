// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.0;

import "../interface/IButtonswapFactory.sol";
import "../interface/IButtonswapPair.sol";
import "../interface/IERC20.sol";
import "../lib/SafeERC20.sol";
import "../YakAdapter.sol";

contract PoolsideV1Adapter is YakAdapter {
    using SafeERC20 for IERC20;

    address public immutable factory;

    constructor(
        string memory _name,
        address _factory,
        uint256 _swapGasEstimate
    ) YakAdapter(_name, _swapGasEstimate) {
        factory = _factory;
    }

    /**
     * @dev Returns sorted token addresses, used to handle return values from pairs sorted in this order
     * @dev Based on https://github.com/buttonwood-protocol/buttonswap-periphery/blob/main/src/libraries/ButtonswapLibrary.sol#L30
     * @param tokenA First token address
     * @param tokenB Second token address
     * @return token0 First sorted token address
     * @return token1 Second sorted token address
     */
    function _sortTokens(address tokenA, address tokenB) private pure returns (address token0, address token1) {
        (token0, token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
    }

    /**
     * @dev Fetches and sorts the pools and reservoirs for a pair.
     *   - Pools are the current token balances in the pair contract serving as liquidity.
     *   - Reservoirs are the current token balances in the pair contract not actively serving as liquidity.
     * @dev Based on https://github.com/buttonwood-protocol/buttonswap-periphery/blob/main/src/libraries/ButtonswapLibrary.sol#L119
     * @param _factory The address of the ButtonswapFactory
     * @param tokenA First token address
     * @param tokenB Second token address
     * @return poolA Pool corresponding to tokenA
     * @return poolB Pool corresponding to tokenB
     * @return reservoirA Reservoir corresponding to tokenA
     * @return reservoirB Reservoir corresponding to tokenB
     */
    function _getLiquidityBalances(
        address _factory,
        address tokenA,
        address tokenB
    )
        private
        view
        returns (
            uint256 poolA,
            uint256 poolB,
            uint256 reservoirA,
            uint256 reservoirB
        )
    {
        (address token0, ) = _sortTokens(tokenA, tokenB);
        address pair = IButtonswapFactory(_factory).getPair(tokenA, tokenB);
        (uint256 pool0, uint256 pool1, uint256 reservoir0, uint256 reservoir1, ) = IButtonswapPair(pair)
            .getLiquidityBalances();
        (poolA, poolB, reservoirA, reservoirB) = tokenA == token0
            ? (pool0, pool1, reservoir0, reservoir1)
            : (pool1, pool0, reservoir1, reservoir0);
    }

    /**
     * @dev Given an input amount of an asset and pair pools, returns the maximum output amount of the other asset
     * Factors in the fee on the input amount.
     * @dev Based on https://github.com/buttonwood-protocol/buttonswap-periphery/blob/main/src/libraries/ButtonswapLibrary.sol#L221
     * @param amountIn The input amount of the asset
     * @param poolIn The balance of the input asset in the pool
     * @param poolOut The balance of the output asset in the pool
     * @return amountOut The output amount of the other asset
     */
    function _getAmountOut(
        uint256 amountIn,
        uint256 poolIn,
        uint256 poolOut
    ) private pure returns (uint256 amountOut) {
        if (amountIn == 0) {
            return 0;
        }
        if (poolIn == 0 || poolOut == 0) {
            return 0;
        }
        uint256 amountInWithFee = amountIn * 997;
        uint256 numerator = amountInWithFee * poolOut;
        uint256 denominator = (poolIn * 1000) + amountInWithFee;
        amountOut = numerator / denominator;
    }

    function _query(
        uint256 _amountIn,
        address _tokenIn,
        address _tokenOut
    ) internal view override returns (uint256 amountOut) {
        if (_tokenIn == _tokenOut || _amountIn == 0) {
            return 0;
        }
        address _factory = factory;
        address pair = IButtonswapFactory(_factory).getPair(_tokenIn, _tokenOut);
        if (pair == address(0)) {
            return 0;
        }
        (uint256 poolIn, uint256 poolOut, , ) = _getLiquidityBalances(_factory, _tokenIn, _tokenOut);
        amountOut = _getAmountOut(_amountIn, poolIn, poolOut);
    }

    function _swap(
        uint256 _amountIn,
        uint256 _amountOut,
        address _tokenIn,
        address _tokenOut,
        address to
    ) internal override {
        address pair = IButtonswapFactory(factory).getPair(_tokenIn, _tokenOut);
        (address token0, ) = _sortTokens(_tokenIn, _tokenOut);
        (uint256 amount0In, uint256 amount1In, uint256 amount0Out, uint256 amount1Out) = _tokenIn == token0
            ? (_amountIn, uint256(0), uint256(0), _amountOut)
            : (uint256(0), _amountIn, _amountOut, uint256(0));
        IERC20(_tokenIn).safeApprove(pair, _amountIn);
        IButtonswapPair(pair).swap(amount0In, amount1In, amount0Out, amount1Out, to);
    }
}
