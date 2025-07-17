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
//                              ,=.
//                ,=""""==.__.="  o".___
//          ,=.=="                  ___/
//    ,==.,"    ,          , \,===""
//   <     ,==)  \"'"=._.==)  \
//    `==''    `"           `"
//

// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.0;

import "../interface/IPlatypus.sol";
import "../interface/IERC20.sol";
import "../interface/IWETH.sol";
import "../lib/SafeERC20.sol";
import "../YakAdapter.sol";

contract PlatypusAdapter is YakAdapter {
    using SafeERC20 for IERC20;

    event PartialPoolSupport(address pool, address[] tkns);
    event AddPoolSupport(address pool);
    event RmPoolSupport(address pool);

    mapping(address => mapping(address => address)) private tknToTknToPool;

    constructor(
        string memory _name,
        uint256 _swapGasEstimate,
        address[] memory _initPools
    ) YakAdapter(_name, _swapGasEstimate) {
        addPools(_initPools);
    }

    function getPoolForTkns(address tknIn, address tknOut) public view returns (address) {
        return tknToTknToPool[tknIn][tknOut];
    }

    function _approveIfNeeded(address tkn, address spender) internal {
        uint256 allowance = IERC20(tkn).allowance(address(this), spender);
        if (allowance < UINT_MAX) {
            IERC20(tkn).approve(spender, UINT_MAX);
        }
    }

    // @dev Returns false if repeated tkns
    function _poolSupportsTkns(address pool, address[] memory tkns) internal view returns (bool) {
        address[] memory supportedTkns = IPlatypus(pool).getTokenAddresses();
        uint256 supportedCount;
        for (uint256 i = 0; i < supportedTkns.length; i++) {
            for (uint256 j = 0; j < tkns.length; j++) {
                if (supportedTkns[i] == tkns[j]) {
                    supportedCount++;
                    break;
                }
            }
        }
        return supportedCount == tkns.length;
    }

    function _setPoolForTkns(address[] memory tkns, address pool) internal {
        for (uint256 i = 0; i < tkns.length; i++) {
            for (uint256 j = 0; j < tkns.length; j++) {
                if (i != j) {
                    tknToTknToPool[tkns[i]][tkns[j]] = pool;
                    if (pool != address(0)) {
                        _approveIfNeeded(tkns[i], pool);
                    }
                }
            }
        }
    }

    function addPools(address[] memory pools) public onlyMaintainer {
        for (uint256 i = 0; i < pools.length; i++) {
            address pool = pools[i];
            address[] memory supportedTkns = IPlatypus(pool).getTokenAddresses();
            _setPoolForTkns(supportedTkns, pool);
            emit AddPoolSupport(pool);
        }
    }

    function setPoolForTkns(address pool, address[] memory tkns) external onlyMaintainer {
        require(tkns.length > 1, "At least two tkns");
        require(pool != address(0), "Only non-zero pool");
        require(_poolSupportsTkns(pool, tkns), "Pool does not support tkns");
        // Assume above checks there is no repeats
        _setPoolForTkns(tkns, pool);
        emit PartialPoolSupport(pool, tkns);
    }

    function rmPools(address[] calldata pools) external onlyMaintainer {
        for (uint256 i = 0; i < pools.length; i++) {
            address pool = pools[i];
            address[] memory supportedTkns = IPlatypus(pool).getTokenAddresses();
            _setPoolForTkns(supportedTkns, address(0));
            emit RmPoolSupport(pool);
        }
    }

    function _query(
        uint256 _amountIn,
        address _tokenIn,
        address _tokenOut
    ) internal view override returns (uint256) {
        address pool = getPoolForTkns(_tokenIn, _tokenOut);
        if (pool == address(0) || _amountIn == 0 || IPlatypus(pool).paused()) {
            return 0;
        }
        try IPlatypus(pool).quotePotentialSwap(_tokenIn, _tokenOut, _amountIn) returns (uint256 amountOut) {
            return amountOut;
        } catch {
            return 0;
        }
    }

    function _swap(
        uint256 _amountIn,
        uint256 _amountOut,
        address _tokenIn,
        address _tokenOut,
        address _to
    ) internal override {
        address pool = getPoolForTkns(_tokenIn, _tokenOut);
        IPlatypus(pool).swap(_tokenIn, _tokenOut, _amountIn, _amountOut, _to, block.timestamp);
    }
}
