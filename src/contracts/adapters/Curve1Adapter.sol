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

// Supports Curve Atricrypto pools and alike

// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.0;

import "../interface/ICurve1.sol";
import "../interface/IERC20.sol";
import "../lib/SafeERC20.sol";
import "../YakAdapter.sol";

contract Curve1Adapter is YakAdapter {
    using SafeERC20 for IERC20;

    mapping(address => uint256) public tokenIndex;
    mapping(address => bool) public isPoolToken;
    address public pool;

    constructor(
        string memory _name,
        address _pool,
        uint256 _swapGasEstimate
    ) YakAdapter(_name, _swapGasEstimate) {
        pool = _pool;
        _setPoolTokens();
    }

    // Mapping indicator which tokens are included in the pool
    function _setPoolTokens() internal {
        for (uint256 i = 0; true; ++i) {
            try ICurve1(pool).underlying_coins(i) returns (address token) {
                _setPoolTokenAllowance(token);
                isPoolToken[token] = true;
                tokenIndex[token] = i;
            } catch {
                break;
            }
        }
    }

    function _setPoolTokenAllowance(address _token) internal {
        IERC20(_token).approve(pool, UINT_MAX);
    }

    function _query(
        uint256 _amountIn,
        address _tokenIn,
        address _tokenOut
    ) internal view override returns (uint256) {
        if (_amountIn == 0 || _tokenIn == _tokenOut || !isPoolToken[_tokenIn] || !isPoolToken[_tokenOut]) {
            return 0;
        }
        try ICurve1(pool).get_dy_underlying(tokenIndex[_tokenIn], tokenIndex[_tokenOut], _amountIn) returns (
            uint256 amountOut
        ) {
            return _applyError(amountOut);
        } catch {
            return 0;
        }
    }

    function _applyError(uint256 _amount) internal pure returns (uint256) {
        // `calc_token_amount` in base_pool is used in part of the query
        // this method does account for deposit fee which causes discrepancy
        // between the query result and the actual swap amount by few bps(0-3.2)
        // Additionally there is a rounding error (swap and query may calc different amounts)
        // Account for above with 4 bps discount
        return _amount == 0 ? 0 : (_amount * (1e4 - 4)) / 1e4;
    }

    function _swap(
        uint256 _amountIn,
        uint256 _amountOut,
        address _tokenIn,
        address _tokenOut,
        address _to
    ) internal override {
        ICurve1(pool).exchange_underlying(tokenIndex[_tokenIn], tokenIndex[_tokenOut], _amountIn, _amountOut);
        uint256 balThis = IERC20(_tokenOut).balanceOf(address(this));
        _returnTo(_tokenOut, balThis, _to);
    }
}
