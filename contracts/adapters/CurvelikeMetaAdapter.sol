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
pragma solidity >=0.7.0;
pragma abicoder v2;

import "../interface/ICurvelikeMeta.sol";
import "../interface/IERC20.sol";
import "../lib/SafeERC20.sol";
import "../lib/SafeMath.sol";
import "../YakAdapter.sol";

contract CurvelikeMetaAdapter is YakAdapter {
    using SafeERC20 for IERC20;
    using SafeMath for uint256;

    uint256 public constant feeDenominator = 1e10;
    address public metaPool;
    address public pool;
    mapping(address => bool) public isPoolToken;
    mapping(address => uint8) public tokenIndex;
    uint256 public poolFeeCompliment;

    constructor(
        string memory _name,
        address _pool,
        uint256 _swapGasEstimate
    ) YakAdapter(_name, _swapGasEstimate) {
        pool = _pool;
        metaPool = ICurvelikeMeta(pool).metaSwapStorage(); // Pool that holds USDCe, USDTe, DAIe
        setPoolFeeCompliment();
        _setPoolTokens();
    }

    function setPoolFeeCompliment() public onlyOwner {
        poolFeeCompliment = feeDenominator - ICurvelikeMeta(pool).swapStorage().swapFee;
    }

    // Mapping indicator which tokens are included in the pool
    function _setPoolTokens() internal {
        // Get nUSD from this pool
        address baseTkn = ICurvelikeMeta(pool).getToken(0);
        _setPoolTokenAllowance(baseTkn);
        isPoolToken[baseTkn] = true;
        tokenIndex[baseTkn] = 0;
        // Get stables from meta pool
        for (uint8 i = 0; true; i++) {
            try ICurvelikeMeta(metaPool).getToken(i) returns (address token) {
                _setPoolTokenAllowance(token);
                isPoolToken[token] = true;
                tokenIndex[token] = i + 1;
            } catch {
                break;
            }
        }
    }

    function _setPoolTokenAllowance(address _token) internal {
        IERC20(_token).approve(pool, UINT_MAX);
    }

    function _isPaused() internal view returns (bool) {
        return ICurvelikeMeta(pool).paused() || ICurvelikeMeta(metaPool).paused();
    }

    function _query(
        uint256 _amountIn,
        address _tokenIn,
        address _tokenOut
    ) internal view override returns (uint256) {
        if (
            _amountIn == 0 || _tokenIn == _tokenOut || !isPoolToken[_tokenIn] || !isPoolToken[_tokenOut] || _isPaused()
        ) {
            return 0;
        }
        try
            ICurvelikeMeta(pool).calculateSwapUnderlying(tokenIndex[_tokenIn], tokenIndex[_tokenOut], _amountIn)
        returns (uint256 amountOut) {
            return amountOut.mul(poolFeeCompliment) / feeDenominator;
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
        ICurvelikeMeta(pool).swapUnderlying(
            tokenIndex[_tokenIn],
            tokenIndex[_tokenOut],
            _amountIn,
            _amountOut,
            block.timestamp
        );
        // Confidently transfer amount-out
        _returnTo(_tokenOut, _amountOut, _to);
    }
}
