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

// Supports Balancerlike pools

// SPDX-License-Identifier: GPL-3.0-only
pragma solidity >=0.7.0;
pragma abicoder v2;

import "../lib/SafeERC20.sol";
import "../lib/SafeMath.sol";
import "../YakAdapter.sol";
import "../interface/IVault.sol";
import "../interface/IBasePool.sol";
import "../interface/IMinimalSwapInfoPool.sol";

contract BalancerlikeAdapter is YakAdapter {
    using SafeERC20 for IERC20;
    using SafeMath for uint256;

    address public vault;

    mapping(address => mapping(address => uint128)) internal poolToTokenIndex;
    mapping(address => mapping(address => address[])) internal tokensToPools;

    constructor(
        string memory _name,
        address _vault,
        address[] memory _pools,
        uint256 _swapGasEstimate
    ) {
        name = _name;
        vault = _vault;
        addPools(_pools);
        setSwapGasEstimate(_swapGasEstimate);
    }

    function addPools(address[] memory _pools) public onlyOwner {
        for (uint128 i = 0; i < _pools.length; i++) {
            address pool = _pools[i];
            bytes32 poolId = IBasePool(pool).getPoolId();
            (IERC20[] memory tokens, , ) = IVault(vault).getPoolTokens(poolId);
            for (uint128 j = 0; j < tokens.length; j++) {
                address token = address(tokens[j]);
                poolToTokenIndex[pool][token] = j;
                for (uint128 k = 0; k < tokens.length; k++) {
                    if (j != k) {
                        tokensToPools[token][address(tokens[k])].push(pool);
                    }
                }
            }
        }
    }

    function removePools(address[] memory _pools) public onlyOwner {
        for (uint256 i = 0; i < _pools.length; i++) {
            address pool = _pools[i];
            bytes32 poolId = IBasePool(pool).getPoolId();
            (IERC20[] memory tokens, , ) = IVault(vault).getPoolTokens(poolId);
            for (uint128 j = 0; j < tokens.length; j++) {
                address token = address(tokens[j]);
                for (uint128 k = 0; k < tokens.length; k++) {
                    if (j != k) {
                        address[] memory currentPools = tokensToPools[token][
                            address(tokens[k])
                        ];
                        for (uint128 m = 0; m < currentPools.length; m++) {
                            if (currentPools[m] == pool) {
                                delete currentPools[m];
                            }
                        }
                        tokensToPools[token][address(tokens[k])] = currentPools;
                    }
                }
            }
        }
    }

    function getPools(address tokenIn, address tokenOut)
        public
        view
        returns (address[] memory)
    {
        return tokensToPools[tokenIn][tokenOut];
    }

    function setAllowances() public override onlyOwner {}

    function _approveIfNeeded(address _tokenIn, uint256 _amount)
        internal
        override
    {
        uint256 allowance = IERC20(_tokenIn).allowance(address(this), vault);
        if (allowance < _amount) {
            IERC20(_tokenIn).safeApprove(vault, _amount);
        }
    }

    function _query(
        uint256 _amountIn,
        address _tokenIn,
        address _tokenOut
    ) internal view override returns (uint256) {
        if (_amountIn == 0 || _tokenIn == _tokenOut) {
            return 0;
        }

        address[] memory pools = getPools(_tokenIn, _tokenOut);
        if (pools.length == 0) {
            return 0;
        }

        (, uint256 amountOut) = _getBestPoolForSwap(
            pools,
            _tokenIn,
            _tokenOut,
            _amountIn
        );
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

        (address pool, ) = _getBestPoolForSwap(
            pools,
            _tokenIn,
            _tokenOut,
            _amountIn
        );

        require(pool != address(0), "Undefined pool");

        IVault.SingleSwap memory swap;
        swap.poolId = IBasePool(pool).getPoolId();
        swap.kind = IVault.SwapKind.GIVEN_IN;
        swap.assetIn = IAsset(_tokenIn);
        swap.assetOut = IAsset(_tokenOut);
        swap.amount = _amountIn;
        swap.userData = "0x";

        IVault.FundManagement memory fund;
        fund.sender = address(this);
        fund.recipient = payable(to);
        fund.fromInternalBalance = false;
        fund.toInternalBalance = false;

        IVault(vault).swap(swap, fund, _amountOut, block.timestamp);
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

            IPoolSwapStructs.SwapRequest memory request;
            request.poolId = IBasePool(pool).getPoolId();
            request.kind = IVault.SwapKind.GIVEN_IN;
            request.tokenIn = IERC20(_tokenIn);
            request.tokenOut = IERC20(_tokenOut);
            request.amount = _amountIn;
            request.userData = "0x";

            uint256 newAmountOut = _getAmountOut(request, pool);
            if (newAmountOut > amountOut) {
                amountOut = newAmountOut;
                bestPool = pool;
            }
        }
    }

    function _getAmountOut(
        IPoolSwapStructs.SwapRequest memory request,
        address pool
    ) internal view returns (uint256 amountOut) {
        // Based on https://github.com/balancer-labs/balancer-v2-monorepo/blob/master/pkg/vault/contracts/Swaps.sol#L275
        (, uint256[] memory balances, ) = IVault(vault).getPoolTokens(
            request.poolId
        );

        uint256 tokenInTotal = balances[
            poolToTokenIndex[pool][address(request.tokenIn)]
        ];
        uint256 tokenOutTotal = balances[
            poolToTokenIndex[pool][address(request.tokenOut)]
        ];

        amountOut = IMinimalSwapInfoPool(pool).onSwap(
            request,
            tokenInTotal,
            tokenOutTotal
        );
    }
}
