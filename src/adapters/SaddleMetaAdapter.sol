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

import "../interface/ISaddleMeta.sol";
import "../interface/IERC20.sol";
import "../lib/SafeERC20.sol";
import "../YakAdapter.sol";

contract SaddleMetaAdapter is YakAdapter {
    using SafeERC20 for IERC20;

    uint256 public constant feeDenominator = 1e10;
    mapping(address => bool) public isPoolToken;
    mapping(address => uint8) public tokenIndex;
    uint256 public poolFeeCompliment;
    address public metaPool;
    address public metaTkn;
    address public pool;

    constructor(
        string memory _name,
        address _pool,
        uint256 _swapGasEstimate
    ) YakAdapter(_name, _swapGasEstimate) {
        pool = _pool;
        metaPool = ISaddleMeta(pool).metaSwapStorage(); // Pool that holds USDCe, USDTe, DAIe
        _setPoolTokens();
    }

    // Mapping indicator which tokens are included in the pool
    function _setPoolTokens() internal {
        metaTkn = ISaddleMeta(pool).getToken(0);
        approveToPool(metaTkn, UINT_MAX);
        tokenIndex[metaTkn] = 0;
        for (uint8 i = 0; true; i++) {
            try ISaddleMeta(metaPool).getToken(i) returns (address token) {
                approveToPool(token, UINT_MAX);
                isPoolToken[token] = true;
                tokenIndex[token] = i + 1;
            } catch {
                break;
            }
        }
    }

    function approveToPool(address _tokenIn, uint256 _amount) internal {
        uint256 allowance = IERC20(_tokenIn).allowance(address(this), pool);
        if (allowance < _amount) {
            IERC20(_tokenIn).safeApprove(pool, UINT_MAX);
        }
    }

    function _isPaused() internal view returns (bool) {
        return ISaddleMeta(pool).paused() || ISaddleMeta(metaPool).paused();
    }

    function _query(
        uint256 _amountIn,
        address _tokenIn,
        address _tokenOut
    ) internal view override returns (uint256 amountOut) {
        if (validInput(_amountIn, _tokenIn, _tokenOut) && !_isPaused())
            amountOut = _getAmountOutSafe(_amountIn, _tokenIn, _tokenOut);
    }

    function validInput(
        uint256 _amountIn,
        address _tokenIn,
        address _tokenOut
    ) internal view returns (bool) {
        return validPath(_tokenIn, _tokenOut) && _amountIn != 0;
    }

    function validPath(address tokenIn, address tokenOut) internal view returns (bool) {
        return (tokenIn == metaTkn && isPoolToken[tokenOut]) || (tokenOut == metaTkn && isPoolToken[tokenIn]);
    }

    function _getAmountOutSafe(
        uint256 _amountIn,
        address _tokenIn,
        address _tokenOut
    ) internal view returns (uint256 amountOut) {
        try ISaddleMeta(pool).calculateSwapUnderlying(tokenIndex[_tokenIn], tokenIndex[_tokenOut], _amountIn) returns (
            uint256 _amountOut
        ) {
            amountOut = _applyError(_amountOut);
        } catch {}
    }

    function _applyError(uint256 _amount) internal pure returns (uint256) {
        return (_amount * 9998) / 10000;
    }

    function _swap(
        uint256 _amountIn,
        uint256 _amountOut,
        address _tokenIn,
        address _tokenOut,
        address _to
    ) internal override {
        ISaddleMeta(pool).swapUnderlying(
            tokenIndex[_tokenIn],
            tokenIndex[_tokenOut],
            _amountIn,
            _amountOut,
            block.timestamp
        );
        uint256 balThis = IERC20(_tokenOut).balanceOf(address(this));
        _returnTo(_tokenOut, balThis, _to);
    }
}
