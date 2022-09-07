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

// Supports Curve MIM pool (manually enter base tokens)

// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.0;

import "../interface/ICurveMeta.sol";
import "../interface/ICurve2.sol";
import "../interface/IERC20.sol";
import "../lib/SafeERC20.sol";
import "../YakAdapter.sol";

interface ICurveSwapper128 {
    function exchange_underlying(
        address pool,
        int128 i,
        int128 j,
        uint256 dx,
        uint256 minDy
    ) external;
}

contract CurveMetaWithSwapperAdapter is YakAdapter {
    using SafeERC20 for IERC20;

    address public immutable metaPool;
    address public immutable basePool;
    address public immutable swapper;
    address public immutable metaTkn;
    mapping(address => int128) public tokenIndex;
    mapping(address => bool) public isPoolToken;

    constructor(
        string memory _name,
        uint256 _swapGasEstimate,
        address _metaPool,
        address _basePool,
        address _swapper
    ) YakAdapter(_name, _swapGasEstimate) {
        metaTkn = setMetaTkn(_metaPool, _swapper);
        metaPool = _metaPool;
        basePool = _basePool;
        swapper = _swapper;
        _setUnderlyingTokens(_basePool, _swapper);
    }

    // Mapping indicator which tokens are included in the pool
    function _setUnderlyingTokens(address _basePool, address _swapper) internal {
        for (uint256 i = 0; true; i++) {
            try ICurve2(_basePool).underlying_coins(i) returns (address token) {
                _setPoolTokenAllowance(token, _swapper);
                isPoolToken[token] = true;
                tokenIndex[token] = int128(int256(i)) + 1;
            } catch {
                break;
            }
        }
    }

    function setMetaTkn(address _metaPool, address _swapper) internal returns (address _metaTkn) {
        _metaTkn = ICurveMeta(_metaPool).coins(0);
        _setPoolTokenAllowance(_metaTkn, _swapper);
        isPoolToken[_metaTkn] = true;
        tokenIndex[_metaTkn] = 0;
    }

    function _setPoolTokenAllowance(address _token, address _target) internal {
        IERC20(_token).approve(_target, UINT_MAX);
    }

    function _query(
        uint256 _amountIn,
        address _tokenIn,
        address _tokenOut
    ) internal view override returns (uint256) {
        if (!validInputParams(_amountIn, _tokenIn, _tokenOut)) {
            return 0;
        }
        try ICurveMeta(metaPool).get_dy_underlying(tokenIndex[_tokenIn], tokenIndex[_tokenOut], _amountIn) returns (
            uint256 amountOut
        ) {
            // `calc_token_amount` in base_pool is used in part of the query
            // this method does account for deposit fee which causes discrepancy
            // between the query result and the actual swap amount by few bps(0-3.2)
            // Additionally there is a rounding error (swap and query may calc different amounts)
            // Account for that with 4 bps discount
            return amountOut == 0 ? 0 : (amountOut * (1e4 - 4)) / 1e4;
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
        return (tkn0 == metaTkn && isPoolToken[tkn1]) || (tkn1 == metaTkn && isPoolToken[tkn0]);
    }

    function _swap(
        uint256 _amountIn,
        uint256 _amountOut,
        address _tokenIn,
        address _tokenOut,
        address _to
    ) internal override {
        ICurveSwapper128(swapper).exchange_underlying(
            metaPool,
            tokenIndex[_tokenIn],
            tokenIndex[_tokenOut],
            _amountIn,
            0
        );
        uint256 balThis = IERC20(_tokenOut).balanceOf(address(this));
        require(balThis >= _amountOut, "Insufficient amount-out");
        _returnTo(_tokenOut, balThis, _to);
    }
}
