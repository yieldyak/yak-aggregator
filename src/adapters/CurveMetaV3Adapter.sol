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

import "../interface/IERC20.sol";
import "../lib/SafeERC20.sol";
import "../YakAdapter.sol";

interface IMetaPool {
    function get_dy_underlying(
        int128,
        int128,
        uint256
    ) external view returns (uint256);

    function exchange_underlying(
        int128,
        int128,
        uint256,
        uint256
    ) external;

    function coins(uint256) external view returns (address);
}

interface IBasePool {
    function coins(uint256) external view returns (address);
}

contract CurveMetaV3Adapter is YakAdapter {
    using SafeERC20 for IERC20;

    mapping(address => mapping(address => int128)) public tokenIndexForPool;
    mapping(address => mapping(address => address)) public poolForTokens;

    constructor(
        string memory _name,
        address[] memory _pools,
        uint256 _swapGasEstimate
    ) YakAdapter(_name, _swapGasEstimate) {
        setPools(_pools);
    }

    function getPool(address tkn0, address tkn1) public view returns (address) {
        return poolForTokens[tkn0][tkn1];
    }

    function rmPools(address[] memory _pools) external onlyMaintainer {
        for (uint256 i; i < _pools.length; ++i) _rmPool(_pools[i]);
    }

    function setPools(address[] memory _pools) public onlyMaintainer {
        for (uint256 i; i < _pools.length; ++i) _setPool(_pools[i]);
    }

    function _setPool(address _pool) internal {
        (address mToken, address basePool) = getCoins(_pool);
        IERC20(mToken).safeApprove(_pool, UINT_MAX);
        for (uint256 i; true; ++i) {
            address uToken = getUnderlyingToken(basePool, i);
            if (uToken == address(0)) break;
            _setTokenPair(_pool, mToken, uToken, int128(int256(i)));
        }
    }

    function _rmPool(address _pool) internal {
        (address mToken, address basePool) = getCoins(_pool);
        for (uint256 i; true; ++i) {
            address uToken = getUnderlyingToken(basePool, i);
            if (uToken == address(0)) break;
            poolForTokens[uToken][mToken] = address(0);
            poolForTokens[mToken][uToken] = address(0);
        }
    }

    function getCoins(address _pool) internal view returns (address meta, address base) {
        meta = IMetaPool(_pool).coins(0);
        base = IMetaPool(_pool).coins(1);
    }

    function _setTokenPair(
        address _pool,
        address _metaTkn,
        address _uToken,
        int128 _index
    ) internal {
        IERC20(_uToken).safeApprove(_pool, UINT_MAX);
        tokenIndexForPool[_pool][_uToken] = _index + 1;
        poolForTokens[_uToken][_metaTkn] = _pool;
        poolForTokens[_metaTkn][_uToken] = _pool;
    }

    function getUnderlyingToken(address basePool, uint256 i) internal view returns (address) {
        try IBasePool(basePool).coins(i) returns (address token) {
            return token;
        } catch {}
    }

    function _query(
        uint256 _amountIn,
        address _tokenIn,
        address _tokenOut
    ) internal view override returns (uint256) {
        address pool = getPool(_tokenIn, _tokenOut);
        if (pool == address(0) || _amountIn == 0) return 0;
        // `calc_token_amount` in base_pool is used in part of the query
        // this method does account for deposit fee which causes discrepancy
        // between the query result and the actual swap amount by few bps(0-3.2)
        // Additionally there is a rounding error (swap and query may calc different amounts)
        // Account for that with 1 bps discount
        uint256 amountOut = safeQuery(pool, _amountIn, _tokenIn, _tokenOut);
        return (amountOut * (1e4 - 1)) / 1e4;
    }

    function safeQuery(
        address _pool,
        uint256 _amountIn,
        address _tokenIn,
        address _tokenOut
    ) internal view returns (uint256) {
        try
            IMetaPool(_pool).get_dy_underlying(
                tokenIndexForPool[_pool][_tokenIn],
                tokenIndexForPool[_pool][_tokenOut],
                _amountIn
            )
        returns (uint256 amountOut) {
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
        address pool = getPool(_tokenIn, _tokenOut);
        IMetaPool(pool).exchange_underlying(
            tokenIndexForPool[pool][_tokenIn],
            tokenIndexForPool[pool][_tokenOut],
            _amountIn,
            _amountOut
        );
        uint256 balThis = IERC20(_tokenOut).balanceOf(address(this));
        _returnTo(_tokenOut, balThis, _to);
    }
}
