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

import "../interface/ICurvePlain128Native.sol";
import "../interface/IERC20.sol";
import "../interface/IWETH.sol";
import "../lib/SafeERC20.sol";
import "../YakAdapter.sol";


contract CurvePlain128NativeAdapter is YakAdapter {
    using SafeERC20 for IERC20;

    address constant NATIVE = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;
    address immutable WNATIVE;
    address public immutable POOL;
    mapping(address => int128) public tokenIndex;
    mapping(address => bool) public isPoolToken;

    constructor(
        string memory _name,
        uint256 _swapGasEstimate,
        address _pool,
        address _wNative
    ) YakAdapter(_name, _swapGasEstimate) {
        IERC20(_wNative).safeApprove(_wNative, UINT_MAX);
        _setPoolTokens(_pool, _wNative);
        WNATIVE = _wNative;
        POOL = _pool;
    }

    // Mapping indicator which tokens are included in the pool
    function _setPoolTokens(address _pool, address _wNative) internal {
        for (uint256 i = 0; true; i++) {
            try ICurvePlain128Native(_pool).coins(i) returns (address token) {
                _addTokenToPool(_pool, token, int128(int256(i)), _wNative);
            } catch {
                break;
            }
        }
    }

    function _addTokenToPool(
        address _pool,
        address _token,
        int128 _index, 
        address _wNative
    ) internal {
        if (_token != NATIVE) {
            IERC20(_token).safeApprove(_pool, UINT_MAX);
        } else {
            _token = _wNative;
        }
        tokenIndex[_token] = _index;
        isPoolToken[_token] = true;
    }

    function _query(
        uint256 _amountIn,
        address _tokenIn,
        address _tokenOut
    ) internal view override returns (uint256) {
        if (!_validArgs(_amountIn, _tokenIn, _tokenOut)) return 0;
        uint256 amountOut = _getDySafe(_amountIn, _tokenIn, _tokenOut);
        // Account for possible rounding error
        return amountOut > 0 ? amountOut - 1 : 0;
    }

    function _validArgs(
        uint256 _amountIn,
        address _tokenIn,
        address _tokenOut
    ) internal view returns (bool) {
        return _amountIn != 0 && 
            _tokenIn != _tokenOut && 
            isPoolToken[_tokenIn] && 
            isPoolToken[_tokenOut];
    }

    function _getDySafe(
        uint256 _amountIn,
        address _tokenIn,
        address _tokenOut
    ) internal view returns (uint256) {
        try ICurvePlain128Native(POOL).get_dy(tokenIndex[_tokenIn], tokenIndex[_tokenOut], _amountIn) returns (
            uint256 amountOut
        ) {
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
        uint256 transferVal;
        if (_tokenIn == WNATIVE) {
            transferVal = _amountIn;
            IWETH(WNATIVE).withdraw(_amountIn);
        }
        uint256 dy = ICurvePlain128Native(POOL).exchange{ value: transferVal }(
            tokenIndex[_tokenIn], 
            tokenIndex[_tokenOut], 
            _amountIn, 
            _amountOut
        );
        if (_tokenOut == WNATIVE) {
            IWETH(WNATIVE).deposit{ value: dy }();
        }
        _returnTo(_tokenOut, dy, _to);
    }
}
