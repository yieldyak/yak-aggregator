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

contract CavalReMultiswapAdapter is YakAdapter {
    using SafeERC20 for IERC20;

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
            address[] memory assets = pool.assetAddresses();
            for (uint128 j = 0; j < assets.length; j++) {
                address token = assets[j];
                poolToTokenIndex[poolAddress][token] = j;
                for (uint128 k = 0; k < assets.length; k++) {
                    if (j != k) {
                        tokensToPools[token][assets[k]].push(pool);
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
            address[] memory assets = pool.assetAddresses();
            for (uint128 j = 0; j < assets.length; j++) {
                address token = assets[j];
                for (uint128 k = 0; k < assets.length; k++) {
                    if (j != k) {
                        address[] memory currentPools = tokensToPools[token][assets[k]];
                        for (uint128 l = 0; l < currentPools.length; l++) {
                            if (currentPools[l] == poolAddress) {
                                delete currentPools[l];
                            }
                        }
                        tokensToPools[token][assets[k]] = currentPools;
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

        (uint256 receiveAmount, ) = ICavalReMultiswapBasePool(poolAddress).swap(
            _tokenIn,
            _tokenOut,
            _amountIn,
            _amountOut
        );
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
        (amountOut, ) = ICavalReMultiswapBasePool(_pool).quoteSwap(_tokenIn, _tokenOut, _amountIn);
    }
}
