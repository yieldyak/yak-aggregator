//       ╟╗                                                                      ╔╬
//       ╞╬╬                                                                    ╬╠╬
//      ╔╣╬╬╬                                                                  ╠╠╠╠╦
//     ╬╬╬╬╬╩                                                                  ╘╠╠╠╠╬
//    ║╬╬╬╬╬                                                                    ╘╠╠╠╠╬
//    ╣╬╬╬╬╬╬╬╬╬╬╬╬╬╬╬      ╒╬╬╬╬╬╬╬╜   ╠╠╬╬╬╬╬╬╬         ╠╬╬╬╬╬╬╬    ╬╬╬╬╬╬╬╬╠╠╠╠╠╠╠╠
//    ╙╬╬╬╬╬╬╬╬╬╬╬╬╬╬╬╬╕    ╬╬╬╬╬╬╬╜   ╣╠╠╬╬╬╬╬╬╬╬        ╠╬╬╬╬╬╬╬   ╬╬╬╬╬╬╬╬╬╠╠╠╠╠╠╠╩
//     ╙╣╬╬╬╬╬╬╬╬╬╬╬╬╬╬╬  ╔╬╬╬╬╬╬╬    ╔╠╠╠╬╬╬╬╬╬╬╬        ╠╬╬╬╬╬╬╬ ╣╬╬╬╬╬╬╬╬╬╬╬╠╠╠╠╝╙
//               ╘╣╬╬╬╬╬╬╬╬╬╬╬╬╬╬    ╒╠╠╠╬╠╬╩╬╬╬╬╬╬       ╠╬╬╬╬╬╬╬╣╬╬╬╬╬╬╬╙
//                 ╣╬╬╬╬╬╬╬╬╬╬╠╣     ╣╬╠╠╠╬╩ ╚╬╬╬╬╬╬      ╠╬╬╬╬╬╬╬╬╬╬╬╬╬╬
//                  ╣╬╬╬╬╬╬╬╬╬╣     ╣╬╠╠╠╬╬   ╣╬╬╬╬╬╬     ╠╬╬╬╬╬╬╬╬╬╬╬╬╬╬
//                   ╟╬╬╬╬╬╬╬╩      ╬╬╠╠╠╠╬╬╬╬╬╬╬╬╬╬╬     ╠╬╬╬╬╬╬╬╠╬╬╬╬╬╬╬
//                    ╬╬╬╬╬╬╬     ╒╬╬╠╠╬╠╠╬╬╬╬╬╬╬╬╬╬╬╬    ╠╬╬╬╬╬╬╬ ╣╬╬╬╬╬╬╬
//                    ╬╬╬╬╬╬╬     ╬╬╬╠╠╠╠╝╝╝╝╝╝╝╠╬╬╬╬╬╬   ╠╬╬╬╬╬╬╬  ╚╬╬╬╬╬╬╬╬
//                    ╬╬╬╬╬╬╬    ╣╬╬╬╬╠╠╩       ╘╬╬╬╬╬╬╬  ╠╬╬╬╬╬╬╬   ╙╬╬╬╬╬╬╬╬
//

// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.0;
import "../YakAdapter.sol";
import "../interface/ICavalReMultiswapBasePool.sol";
import "../interface/IMinimalSwapInfoPool.sol";
import "../lib/FixedPointMathLib.sol";

contract CavalReMultiswapAdapter is YakAdapter {
    using SafeERC20 for IERC20;
    using FixedPointMathLib for uint256;
    using FixedPointMathLib for int256;

    mapping(address => mapping(address => uint128)) internal poolToTokenIndex;
    mapping(address => mapping(address => address[])) internal tokensToPools;

    constructor(
        string memory _name,
        address[] memory _pools,
        uint256 _swapGasEstimate
    ) YakAdapter(_name, _swapGasEstimate) {
        addPools(_pools);
    }

    function addPools(address[] memory _pools) public onlyMaintainer {
        for (uint128 i = 0; i < _pools.length; i++) {
            address poolAddress = _pools[i];
            ICavalReMultiswapBasePool pool = ICavalReMultiswapBasePool(poolAddress);
            AssetState[] memory assets = pool.assets();
            for (uint128 j = 0; j < assets.length; j++) {
                address token = address(assets[j].token);
                poolToTokenIndex[poolAddress][token] = j;
                for (uint128 k = 0; k < assets.length; k++) {
                    if (j != k) {
                        tokensToPools[token][address(assets[k].token)].push(pool);
                        _approveIfNeeded(token, UINT_MAX, poolAddress);
                    }
                }
            }
        }
    }

    function removePools(address[] memory _pools) public onlyMaintainer {
        for (uint256 i = 0; i < _pools.length; i++) {
            address poolAddress = _pools[i];
            ICavalReMultiswapBasePool pool = ICavalReMultiswapBasePool(poolAddress);
            AssetState[] memory assets = pool.assets();
            for (uint128 j = 0; j < assets.length; j++) {
                address token = address(assets[j].token);
                for (uint128 k = 0; k < assets.length; k++) {
                    if (j != k) {
                        address[] memory currentPools = tokensToPools[token][address(assets[k].token)];
                        for (uint128 l = 0; l < currentPools.length; l++) {
                            if (currentPools[l] == poolAddress) {
                                delete currentPools[l];
                            }
                        }
                        tokensToPools[token][address(assets[k].token)] = currentPools;
                    }
                }
            }
        }
    }

    function getPools(address tokenIn, address tokenOut) public view returns (address[] memory) {
        return tokensToPools[tokenIn][tokenOut];
    }

    function _approveIfNeeded(address _tokenIn, uint256 _amount, address pool) internal {
        uint256 allowance = IERC20(_tokenIn).allowance(address(this), pool);
        if (allowance < _amount) {
            IERC20(_tokenIn).safeApprove(pool, _amount);
        }
    }

    function _query(uint256 _amountIn, address _tokenIn, address _tokenOut) internal view override returns (uint256) {
        if (_amountIn == 0 || _tokenIn == _tokenOut) {
            return 0;
        }

        address[] memory pools = getPools(_tokenIn, _tokenOut);
        if (pools.length == 0) {
            return 0;
        }

        (, uint256 amountOut) = _getBestPoolForSwap(pools, _tokenIn, _tokenOut, _amountIn);
        return amountOut;
    }

    function _swap(
        uint256 _amountIn,
        uint256 _amountOut,
        address _tokenIn,
        address _tokenOut,
        address to
    ) internal override {
        address[] memory pools = getPools(_tokenIn, _tokenOut);

        require(pools.length > 0, "No pools for swapping");
        //TODO find best rate
        (address poolAddress, ) = _getBestPoolForSwap(pools, _tokenIn, _tokenOut, _amountIn);

        require(poolAddress != address(0), "Undefined pool");

        (uint256 receiveAmount, ) = ICavalReMultiswapBasePool(poolAddress).swap(_tokenIn, _tokenOut, _amountIn, _amountOut);
        IERC20(_tokenOut).safeTransfer(to, receiveAmount);
    }

    function _getBestPoolForSwap(
        address[] memory pools,
        address _tokenIn,
        address _tokenOut,
        uint256 _amountIn
    ) internal view returns (address bestPool, uint256 amountOut) {
        amountOut = 0;
        bestPool = address(0);
        for (uint128 i; i < pools.length; i++) {
            address pool = pools[i];
            if (pool == address(0)) {
                continue;
            }
            ICavalReMultiswapBasePool poolContract = ICavalReMultiswapBasePool(pool);
            if (poolContract.paused()) {
                continue;
            }

            uint256 newAmountOut = _getAmountOut(_tokenIn, _tokenOut, _amountIn, pool);
            if (newAmountOut > amountOut) {
                amountOut = newAmountOut;
                bestPool = pool;
            }
        }
    }

    function _getAmountOut(
        address _tokenIn,
        address _tokenOut,
        uint256 _amountIn,
        address _pool
    ) internal view returns (uint256 amountOut) {
        //use _querySimpleSwap for now and possibly add logic for other pools later
        (uint256 receiveAmount, ) = _querySimpleSwap(_tokenIn, _amountIn, _tokenOut, _pool);
        return receiveAmount;
    }

    function _querySimpleSwap(
        address payToken,
        uint256 amount,
        address receiveToken,
        address poolAddress
    ) internal view returns (uint256 receiveAmount, uint256 feeAmount) {
        ICavalReMultiswapBasePool pool = ICavalReMultiswapBasePool(poolAddress);
        PoolState storage _poolState = pool.info();
        // Compute fee
        uint256 fee = pool.asset(receiveToken).fee;

        // Compute scaledValueIn
        uint256 scaledValueIn;
        uint256 poolOut;
        {
            AssetState storage assetIn = pool.asset(payToken);
            uint256 amount_ = amount * assetIn.conversion; // Convert to canonical
            scaledValueIn = assetIn.scale.fullMulDiv(amount_, assetIn.balance + amount_);
        }

        uint256 lastPoolBalance = _poolState.balance;
        uint256 scaledPoolOut = scaledValueIn.mulWadUp(fee);
        if (payToken == address(_poolState.token)) {
            uint256 poolIn = amount;
            poolOut = fee.fullMulDiv(
                scaledValueIn.mulWadUp(lastPoolBalance - poolIn) + _poolState.scale.mulWadUp(poolIn),
                _poolState.scale - scaledPoolOut
            );
            scaledValueIn += _poolState.scale.fullMulDiv(poolIn, lastPoolBalance + poolOut - poolIn);
            feeAmount = poolOut;
        } else {
            poolOut = lastPoolBalance.fullMulDiv(scaledPoolOut, _poolState.scale - scaledPoolOut);
            feeAmount = poolOut.fullMulDiv(fee, scaledValueIn);
        }

        // Compute receiveAmount
        if (receiveToken == address(_poolState.token)) {
            receiveAmount = poolOut - feeAmount;
        } else {
            AssetState storage assetOut = pool.asset(receiveToken);
            receiveAmount =
                assetOut.balance.fullMulDiv(scaledValueIn, assetOut.scale + scaledValueIn) /
                assetOut.conversion; // Convert from canonical
        }

        return (receiveAmount, feeAmount);
    }

    function _queryMultiswap(
        address[] memory payTokens,
        uint256[] memory amounts,
        address[] memory receiveTokens,
        uint256[] memory allocations,
        address poolAddress
    ) internal view returns (uint256[] memory receiveAmounts, uint256 feeAmount) {
        ICavalReMultiswapBasePool pool = ICavalReMultiswapBasePool(poolAddress);
        PoolState storage _poolState = pool.info();
        receiveAmounts = new uint256[](receiveTokens.length);

        {
            // Compute fee
            uint256 fee;
            {
                for (uint256 i; i < receiveTokens.length; i++) {
                    fee += allocations[i].mulWadUp(pool.asset(receiveTokens[i]).fee);
                }
            }

            // Compute scaledValueIn
            uint256 scaledValueIn;
            uint256 poolOut;
            {
                // Contribution from assets only
                for (uint256 i; i < payTokens.length; i++) {
                    address token_ = payTokens[i];
                    if (token_ != address(this)) {
                        AssetState storage assetIn = pool.asset(token_);
                        uint256 amount_ = amounts[i] * assetIn.conversion; // Convert to canonical
                        scaledValueIn += assetIn.scale.fullMulDiv(amount_, assetIn.balance + amount_);
                    }
                }

                uint256 poolAlloc = fee;
                if (receiveTokens[0] == address(_poolState.token)) {
                    poolAlloc += allocations[0].mulWadUp(1e18 - fee);
                }
                uint256 lastPoolBalance = _poolState.balance;
                uint256 scaledPoolOut = scaledValueIn.mulWadUp(poolAlloc);
                if (payTokens[0] == address(_poolState.token)) {
                    uint256 poolIn = amounts[0];
                    poolOut = poolAlloc.fullMulDiv(
                        scaledValueIn.mulWadUp(lastPoolBalance - poolIn) + _poolState.scale.mulWadUp(poolIn),
                        _poolState.scale - scaledPoolOut
                    );
                    scaledValueIn += _poolState.scale.fullMulDiv(poolIn, lastPoolBalance + poolOut - poolIn);
                    feeAmount = poolOut;
                } else {
                    poolOut = lastPoolBalance.fullMulDiv(scaledPoolOut, _poolState.scale - scaledPoolOut);
                    if (poolAlloc > 0) {
                        feeAmount = poolOut.fullMulDiv(fee, poolAlloc);
                    }
                }
            }

            // Compute receiveAmounts
            {
                uint256 scaledValueOut;

                address receiveToken;
                uint256 allocation;
                for (uint256 i; i < receiveTokens.length; i++) {
                    receiveToken = receiveTokens[i];
                    allocation = allocations[i].mulWadUp(1e18 - fee);
                    scaledValueOut = scaledValueIn.mulWadUp(allocation);
                    if (receiveToken == address(this)) {
                        receiveAmounts[i] = poolOut - feeAmount;
                    } else {
                        AssetState storage assetOut = pool.asset(receiveToken);
                        receiveAmounts[i] =
                            assetOut.balance.fullMulDiv(scaledValueOut, assetOut.scale + scaledValueOut) /
                            assetOut.conversion; // Convert from canonical
                    }
                }
            }
        }
        return (receiveAmounts, feeAmount);
    }
}
