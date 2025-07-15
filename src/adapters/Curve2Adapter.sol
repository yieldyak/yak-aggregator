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

// Supports Curve AAVE and Ren pool and alike

// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.0;

import "../interface/ICurve2.sol";
import "../interface/IERC20.sol";
import "../lib/SafeERC20.sol";
import "../YakAdapter.sol";

contract Curve2Adapter is YakAdapter {
    using SafeERC20 for IERC20;

    uint256 constant BPS_DEN = 1e4;
    uint256 constant MAX_ERR_BPS = 1;

    mapping(address => bool) public isPoolToken;
    mapping(address => int128) public tokenIndex;
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
        for (uint256 i = 0; true; i++) {
            try ICurve2(pool).underlying_coins(i) returns (address token) {
                _setPoolTokenAllowance(token);
                isPoolToken[token] = true;
                tokenIndex[token] = int128(int256(i));
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
        try ICurve2(pool).get_dy_underlying(tokenIndex[_tokenIn], tokenIndex[_tokenOut], _amountIn) returns (
            uint256 amountOut
        ) {
            return _applyErr(amountOut);
        } catch {
            return 0;
        }
    }

    function _applyErr(uint256 x) internal pure returns (uint256) {
        return (x * (BPS_DEN - MAX_ERR_BPS)) / BPS_DEN;
    }

    function _swap(
        uint256 _amountIn,
        uint256 _amountOut,
        address _tokenIn,
        address _tokenOut,
        address _to
    ) internal override {
        ICurve2(pool).exchange_underlying(tokenIndex[_tokenIn], tokenIndex[_tokenOut], _amountIn, 0);
        uint256 balThis = IERC20(_tokenOut).balanceOf(address(this));
        require(balThis >= _amountOut, "Insufficient amount out");
        _returnTo(_tokenOut, balThis, _to);
    }
}
