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
//                            ,=.
//                ,=""""==.__.="  o".___
//          ,=.=="                  ___/
//    ,==.,"    ,          , \,===""
//   <     ,==)  \"'"=._.==)  \
//    `==''    `"           `"
//

// SPDX-License-Identifier: GPL-3.0-only
pragma solidity >=0.7.0;

import "../interface/IPlatypus.sol";
import "../interface/IERC20.sol";
import "../interface/IWETH.sol";
import "../lib/SafeERC20.sol";
import "../YakAdapter.sol";


contract PlatypusAdapter is YakAdapter {
    using SafeERC20 for IERC20;

    event AddPoolSupport(
        address pool
    );

    event PartialPoolSupport(
        address pool, 
        address[] tkns
    );

    event RmPoolSupport(
        address pool
    );

    bytes32 public constant indentifier = keccak256("PlatypusAdapter");
    mapping(address => mapping(address => address)) private tknToTknToPool;

    constructor (
        string memory _name, 
        uint _swapGasEstimate
    ) {
        name = _name;
        setSwapGasEstimate(_swapGasEstimate);
    }

    function setAllowances() public override onlyOwner {}

    function getPoolForTkns(
        address tknIn, 
        address tknOut
    ) public view returns (address) {
        return tknToTknToPool[tknIn][tknOut];
    }

    function _approveIfNeeded(address tkn, address spender) internal {
        uint allowance = IERC20(tkn).allowance(address(this), spender);
        if (allowance < UINT_MAX) {
            IERC20(tkn).approve(spender, UINT_MAX);
        }
    }

    // @dev Returns false if repeated tkns
    function _poolSupportsTkns(
        address pool,
        address[] memory tkns
    ) internal view returns (bool) {
        address[] memory supportedTkns = IPlatypus(pool).getTokenAddresses();
        uint supportedCount;
        for (uint i = 0; i < supportedTkns.length; i++) {
            for (uint j = 0; j < tkns.length; j++) {
                if (supportedTkns[i] == tkns[j]) {
                    supportedCount++;
                    break;
                }
            }
        }
        return supportedCount == tkns.length;
    }

    function _setPoolForTkns(
        address[] memory tkns, 
        address pool
    ) internal {
        for (uint i = 0; i < tkns.length; i++) {
            for (uint j = 0; j < tkns.length; j++) {
                if (i != j) {
                    tknToTknToPool[tkns[i]][tkns[j]] = pool;
                    if (pool != address(0)) {
                        _approveIfNeeded(tkns[i], pool);
                    }
                }
            }
        }
    }

    // Add pools for all tkns it supports
    function addPools(address[] calldata pools) external onlyOwner {
        for (uint i = 0; i < pools.length; i++) {
            address pool = pools[i];
            address[] memory supportedTkns = IPlatypus(pool).getTokenAddresses();
            _setPoolForTkns(supportedTkns, pool);
            emit AddPoolSupport(pool);
        }
    }

    // Manually set the pool support for tkns
    function setPoolForTkns(
        address pool,
        address[] memory tkns
    ) external onlyOwner {
        require(tkns.length > 1, 'At least two tkns');
        require(pool != address(0), 'Only non-zero pool');
        require(_poolSupportsTkns(pool, tkns), 'Pool does not support tkns');
        // Assume above checks there is no repeats
        _setPoolForTkns(tkns, pool);
        emit PartialPoolSupport(pool, tkns);
    }

    function rmPools(address[] calldata pools) external onlyOwner {
        for (uint i = 0; i < pools.length; i++) {
            address pool = pools[i];
            address[] memory supportedTkns = IPlatypus(pool).getTokenAddresses();
            _setPoolForTkns(supportedTkns, address(0));
            emit RmPoolSupport(pool);
        }
    }

    function _query(
        uint _amountIn, 
        address _tokenIn, 
        address _tokenOut
    ) internal override view returns (uint) {
        address pool = getPoolForTkns(_tokenIn, _tokenOut);
        if (
            pool == address(0) ||
            _amountIn == 0 ||
            IPlatypus(pool).paused()
        ) { return 0; }
        try IPlatypus(pool).quotePotentialSwap(
            _tokenIn, 
            _tokenOut, 
            _amountIn
        ) returns (uint amountOut) {
            return amountOut;
        } catch {
            return 0;
        }
    }

    function _swap(
        uint _amountIn, 
        uint _amountOut, 
        address _tokenIn, 
        address _tokenOut, 
        address _to
    ) internal override {
        address pool = getPoolForTkns(_tokenIn, _tokenOut);
        IPlatypus(pool).swap(
            _tokenIn, 
            _tokenOut, 
            _amountIn, 
            _amountOut,
            _to,
            block.timestamp
        );
    }

    function _approveIfNeeded(address _tokenIn, uint _amount) internal override {}

}