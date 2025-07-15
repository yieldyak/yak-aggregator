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

import "../interface/IDodoV2.sol";
import "../interface/IERC20.sol";
import "../lib/SafeERC20.sol";
import "../YakAdapter.sol";

contract DodoV2Adapter is YakAdapter {
    using SafeERC20 for IERC20;

    mapping(address => mapping(address => address)) public tknsToPool; // base > quote > pool

    constructor(
        string memory _name,
        address[] memory _pools,
        uint256 _gasEstimate
    ) YakAdapter(_name, _gasEstimate) {
        _setPools(_pools, true);
    }

    function setPools(address[] memory _pools, bool overwrite) external onlyMaintainer {
        _setPools(_pools, overwrite);
    }

    function _rmPools(address[] memory _pools) external onlyMaintainer {
        for (uint256 i; i < _pools.length; ++i) {
            (address baseTkn, address quoteTkn) = _getTknsForPool(_pools[i]);
            tknsToPool[baseTkn][quoteTkn] = address(0);
        }
    }

    function _setPools(address[] memory _pools, bool overwrite) internal {
        for (uint256 i; i < _pools.length; ++i) _setPool(_pools[i], overwrite);
    }

    function _setPool(address _pool, bool overwrite) internal {
        (address baseTkn, address quoteTkn) = _getTknsForPool(_pool);
        if (!overwrite) _overwriteCheck(baseTkn, quoteTkn, _pool);
        tknsToPool[baseTkn][quoteTkn] = _pool;
    }

    function _getTknsForPool(address _pool) internal view returns (address baseToken, address quoteToken) {
        baseToken = IDodoV2(_pool)._BASE_TOKEN_();
        quoteToken = IDodoV2(_pool)._QUOTE_TOKEN_();
    }

    function _overwriteCheck(
        address baseTkn,
        address quoteTkn,
        address pool
    ) internal view {
        address existingPool = tknsToPool[baseTkn][quoteTkn];
        require(existingPool == address(0) || existingPool == pool, "Not allowed to overwrite");
    }

    function _query(
        uint256 _amountIn,
        address _tokenIn,
        address _tokenOut
    ) internal view override returns (uint256 returnAmount) {
        if (_amountIn == 0) return 0;
        address pool = tknsToPool[_tokenIn][_tokenOut];
        if (pool != address(0)) return IDodoV2(pool).querySellBase(address(this), _amountIn);
        pool = tknsToPool[_tokenOut][_tokenIn];
        if (pool != address(0)) return IDodoV2(pool).querySellQuote(address(this), _amountIn);
    }

    function _swap(
        uint256 _amountIn,
        uint256 _amountOut,
        address _tokenIn,
        address _tokenOut,
        address _to
    ) internal override {
        uint256 returned = _dodoSwap(_amountIn, _tokenIn, _tokenOut);
        require(returned >= _amountOut, "Insufficient amount-out");
        _returnTo(_tokenOut, returned, _to);
    }

    function _dodoSwap(
        uint256 _amountIn,
        address _tokenIn,
        address _tokenOut
    ) internal returns (uint256) {
        (function(address) external returns (uint256) fn, address pool) = _getPoolAndSwapFn(_tokenIn, _tokenOut);
        IERC20(_tokenIn).safeTransfer(pool, _amountIn);
        return fn(address(this));
    }

    function _getPoolAndSwapFn(address _tokenIn, address _tokenOut)
        internal
        view
        returns (function(address) external returns (uint256), address)
    {
        address pool = tknsToPool[_tokenIn][_tokenOut];
        if (pool != address(0)) return (IDodoV2(pool).sellBase, pool);
        pool = tknsToPool[_tokenOut][_tokenIn];
        if (pool != address(0)) return (IDodoV2(pool).sellQuote, pool);
        revert("Token pair not supported");
    }
}
