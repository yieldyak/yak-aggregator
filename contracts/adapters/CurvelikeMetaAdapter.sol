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
    using SafeMath for uint;

    bytes32 public constant id = keccak256("CurvelikeMetaAdapter");
    uint public constant feeDenominator = 1e10;
    address public metaPool;
    address public pool;
    mapping (address => bool) public isPoolToken;
    mapping (address => uint8) public tokenIndex;
    uint public poolFeeCompliment;

    constructor (string memory _name, address _pool, uint _swapGasEstimate) {
        pool = _pool;
        name = _name;
        metaPool = ICurvelikeMeta(pool).metaSwapStorage();  // Pool that holds USDCe, USDTe, DAIe 
        setSwapGasEstimate(_swapGasEstimate);
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
        isPoolToken[baseTkn] = true;
        tokenIndex[baseTkn] = 0;
        // Get stables from meta pool
        for (uint8 i=0; true; i++) {
            try ICurvelikeMeta(metaPool).getToken(i) returns (address token) {
                isPoolToken[token] = true;
                tokenIndex[token] = i + 1;
            } catch {
                break;
            }
        }
    }

    function setAllowances() public override onlyOwner {}

    function _approveIfNeeded(address _tokenIn, uint _amount) internal override {
        uint allowance = IERC20(_tokenIn).allowance(address(this), pool);
        if (allowance < _amount) {
            IERC20(_tokenIn).safeApprove(pool, UINT_MAX);
        }
    }

    function _isPaused() internal view returns (bool) {
        return ICurvelikeMeta(pool).paused() || ICurvelikeMeta(metaPool).paused();
    }

    function _query(
        uint _amountIn, 
        address _tokenIn, 
        address _tokenOut
    ) internal override view returns (uint) {
        if (
            _amountIn==0 || 
            _tokenIn==_tokenOut ||
            !isPoolToken[_tokenIn] || 
            !isPoolToken[_tokenOut] || 
            _isPaused()
        ) { return 0; }
        try ICurvelikeMeta(pool).calculateSwapUnderlying(
            tokenIndex[_tokenIn], 
            tokenIndex[_tokenOut], 
            _amountIn
        ) returns (uint amountOut) {
            return amountOut.mul(poolFeeCompliment) / feeDenominator;
        } catch {
            return 0;
        }
    }

    function _swap(
        uint _amountIn, 
        uint _amountOut, 
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