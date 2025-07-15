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

import "../interface/ICurvePlain256.sol";
import "../interface/IERC20.sol";
import "../lib/SafeERC20.sol";
import "../YakAdapter.sol";

contract CurvePlain256Adapter is YakAdapter {
    using SafeERC20 for IERC20;

    address public immutable POOL;
    mapping(address => uint256) public tokenIndex;
    mapping(address => bool) public isPoolToken;

    constructor(
        string memory _name,
        address _pool,
        uint256 _swapGasEstimate
    ) YakAdapter(_name, _swapGasEstimate) {
        name = _name;
        POOL = _pool;
        _setPoolTokens(_pool);
        setSwapGasEstimate(_swapGasEstimate);
    }

    function _setPoolTokens(address _pool) internal {
        for (uint256 i = 0; true; i++) {
            address token = _getCoinByIndexSafe(_pool, i);
            if (token == address(0)) break;
            _addToken(_pool, token, i);
        }
    }

    function _getCoinByIndexSafe(address _pool, uint256 _index) internal view returns (address token) {
        try ICurvePlain256(_pool).coins(_index) returns (address _token) {
            token = _token;
        } catch {}
    }

    function _addToken(
        address _pool,
        address _token,
        uint256 _index
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
        return _amountIn != 0 && _tokenIn != _tokenOut && isPoolToken[_tokenIn] && isPoolToken[_tokenOut];
    }

    function _getDySafe(
        uint256 _amountIn,
        address _tokenIn,
        address _tokenOut
    ) internal view returns (uint256) {
        try ICurvePlain256(POOL).get_dy(tokenIndex[_tokenIn], tokenIndex[_tokenOut], _amountIn) returns (
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
        ICurvePlain256(POOL).exchange(tokenIndex[_tokenIn], tokenIndex[_tokenOut], _amountIn, _amountOut);
        // Confidently transfer amount-out
        _returnTo(_tokenOut, _amountOut, _to);
    }
}
