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

contract CurveMetaV2Adapter is YakAdapter {
    using SafeERC20 for IERC20;

    address public immutable META_COIN;
    address public immutable POOL;
    mapping(address => int128) public tokenIndex;
    mapping(address => bool) public isPoolToken;

    constructor(
        string memory _name,
        address _pool,
        uint256 _swapGasEstimate
    ) YakAdapter(_name, _swapGasEstimate) {
        address metaCoin = getMetaCoin(_pool);
        approveAndAddTokenToAdapter(_pool, metaCoin, 0);
        addUnderlyingTkns(_pool);
        META_COIN = metaCoin;
        POOL = _pool;
    }

    function getMetaCoin(address _pool) internal view returns (address) {
        return IMetaPool(_pool).coins(0);
    }

    function initPoolAndReturnMetaTkn(address _pool) internal returns (address coin0) {
        coin0 = IMetaPool(_pool).coins(0);
        approveAndAddTokenToAdapter(_pool, coin0, 0);
    }

    function addUnderlyingTkns(address metaPool) internal {
        address basePool = IMetaPool(metaPool).coins(1);
        for (uint256 i; true; ++i) {
            address token = getUnderlyingToken(basePool, i);
            if (token == address(0)) break;
            approveAndAddTokenToAdapter(metaPool, token, int128(int256(i)) + 1);
        }
    }

    function getUnderlyingToken(address basePool, uint256 i) internal view returns (address) {
        try IBasePool(basePool).coins(i) returns (address token) {
            return token;
        } catch {}
    }

    function approveAndAddTokenToAdapter(
        address _pool,
        address _token,
        int128 _index
    ) internal {
        IERC20(_token).safeApprove(_pool, UINT_MAX);
        tokenIndex[_token] = _index;
        isPoolToken[_token] = true;
    }

    function _query(
        uint256 _amountIn,
        address _tokenIn,
        address _tokenOut
    ) internal view override returns (uint256) {
        if (!validInputParams(_amountIn, _tokenIn, _tokenOut)) return 0;
        // `calc_token_amount` in base_pool is used in part of the query
        // this method does account for deposit fee which causes discrepancy
        // between the query result and the actual swap amount by few bps(0-3.2)
        // Additionally there is a rounding error (swap and query may calc different amounts)
        // Account for that with 1 bps discount
        uint256 amountOut = safeQuery(_amountIn, _tokenIn, _tokenOut);
        return (amountOut * (1e4 - 1)) / 1e4;
    }

    function safeQuery(
        uint256 _amountIn,
        address _tokenIn,
        address _tokenOut
    ) internal view returns (uint256) {
        try IMetaPool(POOL).get_dy_underlying(tokenIndex[_tokenIn], tokenIndex[_tokenOut], _amountIn) returns (
            uint256 amountOut
        ) {
            return amountOut;
        } catch {
            return 0;
        }
    }

    function validInputParams(
        uint256 _amountIn,
        address _tokenIn,
        address _tokenOut
    ) internal view returns (bool) {
        return _amountIn != 0 && _tokenIn != _tokenOut && validPath(_tokenIn, _tokenOut);
    }

    function validPath(address tkn0, address tkn1) internal view returns (bool) {
        return (tkn0 == META_COIN && isPoolToken[tkn1]) || (tkn1 == META_COIN && isPoolToken[tkn0]);
    }

    function _swap(
        uint256 _amountIn,
        uint256 _amountOut,
        address _tokenIn,
        address _tokenOut,
        address _to
    ) internal override {
        IMetaPool(POOL).exchange_underlying(tokenIndex[_tokenIn], tokenIndex[_tokenOut], _amountIn, _amountOut);
        uint256 balThis = IERC20(_tokenOut).balanceOf(address(this));
        _returnTo(_tokenOut, balThis, _to);
    }
}
