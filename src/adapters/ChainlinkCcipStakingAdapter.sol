// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.0;

import "../interface/IChainlinkCcipStaking.sol";
import "../YakAdapter.sol";

/**
 * @notice Adapter for Chainlink CCIP direct staking contracts backed by an OraclePool.
 * @dev Supports the fast-stake path from the configured token in to token out.
 */
contract ChainlinkCcipStakingAdapter is YakAdapter {
    uint256 private constant PRECISION = 1e18;

    address public immutable staking;
    address public immutable oraclePool;
    address public immutable tokenIn;
    address public immutable tokenOut;

    constructor(string memory _name, address _staking, uint256 _swapGasEstimate) YakAdapter(_name, _swapGasEstimate) {
        staking = _staking;

        address _oraclePool = IChainlinkCcipStaking(_staking).getOraclePool();
        oraclePool = _oraclePool;
        tokenIn = IChainlinkCcipOraclePool(_oraclePool).TOKEN_IN();
        tokenOut = IChainlinkCcipOraclePool(_oraclePool).TOKEN_OUT();

        IERC20(tokenIn).approve(_staking, UINT_MAX);
    }

    function _query(uint256 _amountIn, address _tokenIn, address _tokenOut)
        internal
        view
        override
        returns (uint256 amountOut)
    {
        if (_amountIn == 0 || _tokenIn != tokenIn || _tokenOut != tokenOut) return 0;

        if (_isPaused()) return 0;

        address oracle = IChainlinkCcipOraclePool(oraclePool).getOracle();
        if (oracle == address(0)) return 0;

        uint256 price = IChainlinkCcipOracle(oracle).getLatestAnswer();
        if (price == 0) return 0;

        uint256 fee = uint256(IChainlinkCcipOraclePool(oraclePool).getFee());
        if (fee > PRECISION) return 0;

        uint256 feeAmount = (_amountIn * fee) / PRECISION;
        amountOut = ((_amountIn - feeAmount) * PRECISION) / price;

        uint256 availableOut = IERC20(tokenOut).balanceOf(oraclePool);
        if (amountOut > availableOut) return 0;
    }

    function _swap(uint256 _amountIn, uint256 _amountOut, address _tokenIn, address _tokenOut, address _to)
        internal
        override
    {
        if (_tokenIn != tokenIn || _tokenOut != tokenOut) revert("ChainlinkCcipStakingAdapter: Unsupported token");

        uint256 amountOut = IChainlinkCcipStaking(staking).fastStake(_tokenIn, _amountIn, _amountOut);
        _returnTo(_tokenOut, amountOut, _to);
    }

    function _isPaused() internal view returns (bool) {
        (bool success, bytes memory data) = oraclePool.staticcall(abi.encodeWithSelector(IChainlinkCcipOraclePool.paused.selector));
        return success && data.length == 32 && abi.decode(data, (bool));
    }
}
