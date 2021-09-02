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

import "../interface/ICurveLikePool.sol";
import "../interface/IERC20.sol";
import "../interface/IWETH.sol";
import "../lib/SafeERC20.sol";
import "../YakAdapter.sol";

contract CurveLikeAdapter is YakAdapter {
    using SafeERC20 for IERC20;

    bytes32 public constant indentifier = '0x43757276656c696b65';  // hex('Curvelike')
    mapping (address => bool) public TOKENS_MAP;
    address public pool;

    constructor (
        string memory _name, 
        address _pool, 
        uint8 _tokenCount, 
        uint _swapGasEstimate
    ) {
        pool = _pool;
        name = _name;
        setSwapGasEstimate(_swapGasEstimate);
        _setPoolTokens(_tokenCount);
    }

    // Mapping indicator which tokens are included in the pool 
    function _setPoolTokens(uint8 _tokenCount) internal {
        for (uint8 index=0; index<_tokenCount; index++) {
            IERC20 token = ICurveLikePool(pool).getToken(index);
            TOKENS_MAP[address(token)] = true;
        }
    }

    function setAllowances() public override onlyOwner {}

    function _approveIfNeeded(address _tokenIn, uint _amount) internal override {
        uint allowance = IERC20(_tokenIn).allowance(address(this), pool);
        if (allowance < _amount) {
            IERC20(_tokenIn).safeApprove(pool, UINT_MAX);
        }
    }

    function _query(
        uint _amountIn, 
        address _tokenIn, 
        address _tokenOut
    ) internal override view returns (uint) {
        if (_tokenIn==_tokenOut) { return 0; }
        // Cancel query if pool is closed
        if (ICurveLikePool(pool).paused() || _amountIn==0) { return 0; }
        // Cancel query if tokens not in the pool
        if (!TOKENS_MAP[_tokenIn] || !TOKENS_MAP[_tokenOut]) { return 0; }
        uint tokenIndexIn = ICurveLikePool(pool).getTokenIndex(_tokenIn);
        uint tokenIndexOut = ICurveLikePool(pool).getTokenIndex(_tokenOut);
        try ICurveLikePool(pool).calculateSwap(
            uint8(tokenIndexIn), 
            uint8(tokenIndexOut), 
            _amountIn
        ) returns (uint amountOut) {
            return amountOut;
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
        ICurveLikePool(pool).swap(
            ICurveLikePool(pool).getTokenIndex(_tokenIn), 
            ICurveLikePool(pool).getTokenIndex(_tokenOut), 
            _amountIn, 
            _amountOut, 
            block.timestamp
        );
        // Confidently transfer amount-out
        _returnTo(_tokenOut, _amountOut, _to);
    }

}