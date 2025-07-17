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

import "../interface/IDodoV1.sol";
import "../interface/IERC20.sol";
import "../lib/SafeERC20.sol";
import "../YakAdapter.sol";

contract DodoV1Adapter is YakAdapter {
    using SafeERC20 for IERC20;

    address public immutable HELPER;
    mapping(address => mapping(address => address)) tknsToPool; // base > quote > pool

    constructor(
        string memory _name,
        address[] memory _pools,
        address _helper,
        uint256 _gasEstimate
    ) YakAdapter(_name, _gasEstimate) {
        _setPools(_pools, true);
        HELPER = _helper;
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
        _approveTknsForPool(baseTkn, quoteTkn, _pool);
        tknsToPool[baseTkn][quoteTkn] = _pool;
    }

    function _getTknsForPool(address _pool) internal view returns (address baseToken, address quoteToken) {
        baseToken = IDodoV1(_pool)._BASE_TOKEN_();
        quoteToken = IDodoV1(_pool)._QUOTE_TOKEN_();
    }

    function _overwriteCheck(
        address baseTkn,
        address quoteTkn,
        address pool
    ) internal view {
        address existingPool = tknsToPool[baseTkn][quoteTkn];
        require(existingPool == address(0) || existingPool == pool, "Not allowed to overwrite");
    }

    function _approveTknsForPool(
        address _baseTkn,
        address _quoteTkn,
        address _pool
    ) internal {
        IERC20(_baseTkn).safeApprove(_pool, UINT_MAX);
        IERC20(_quoteTkn).safeApprove(_pool, UINT_MAX);
    }

    function _query(
        uint256 _amountIn,
        address _tokenIn,
        address _tokenOut
    ) internal view override returns (uint256) {
        if (_amountIn == 0) return 0;
        address pool = tknsToPool[_tokenIn][_tokenOut];
        if (pool != address(0)) return IDodoV1(pool).querySellBaseToken(_amountIn);
        pool = tknsToPool[_tokenOut][_tokenIn];
        if (pool != address(0)) return IDodoHelper(HELPER).querySellQuoteToken(pool, _amountIn);
    }

    function _swap(
        uint256 _amountIn,
        uint256 _amountOut,
        address _tokenIn,
        address _tokenOut,
        address _to
    ) internal override {
        address pool = tknsToPool[_tokenIn][_tokenOut];
        if (pool != address(0)) IDodoV1(pool).sellBaseToken(_amountIn, _amountOut, "");
        pool = tknsToPool[_tokenOut][_tokenIn];
        if (pool != address(0)) IDodoV1(pool).buyBaseToken(_amountOut, _amountIn, "");
        _returnTo(_tokenOut, _amountOut, _to);
    }
}
