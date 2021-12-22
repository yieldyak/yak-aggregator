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
//     

// SPDX-License-Identifier: GPL-3.0-only
pragma solidity >=0.7.0;

import "../interface/IxJOE.sol";
import "../lib/SafeERC20.sol";
import "../lib/SafeMath.sol";
import "../YakAdapter.sol";

contract XJoeAdapter is YakAdapter {
    using SafeERC20 for IERC20;
    using SafeMath for uint;

    bytes32 public constant ID = keccak256('XJoeAdapter');
    address public constant JOE = 0x6e84a6216eA6dACC71eE8E6b0a5B7322EEbC0fDd;
    address public constant XJOE = 0x57319d41F71E81F3c65F2a47CA4e001EbAFd4F33;

    constructor(uint _swapGasEstimate) {
        name = 'XJoeAdapter';
        setSwapGasEstimate(_swapGasEstimate);
        setAllowances();
    }

    function _approveIfNeeded(address _tokenIn, uint _amount) internal override {}

    function queryEnter(uint _amountIn) internal view returns (uint) {
        uint totalJoe = IERC20(JOE).balanceOf(XJOE);
        uint totalShares = IxJOE(XJOE).totalSupply();
        if (totalShares == 0 || totalJoe == 0) {
            return _amountIn;
        }
        return _amountIn.mul(totalShares) / totalJoe;
    }

    function queryLeave(uint _amountIn) internal view returns (uint) {
        uint totalShares = IxJOE(XJOE).totalSupply();
        return _amountIn.mul(IERC20(JOE).balanceOf(XJOE)) / totalShares;
    }

    function _query(
        uint _amountIn, 
        address _tokenIn, 
        address _tokenOut
    ) internal override view returns (uint amountOut) {  
        if (_tokenIn == JOE && _tokenOut == XJOE) {
            return queryEnter(_amountIn);
        } else if (_tokenIn == XJOE && _tokenOut == JOE) {
            return queryLeave(_amountIn);
        }
    }

    function _swap(
        uint _amountIn, 
        uint _amountOut, 
        address _tokenIn, 
        address _tokenOut, 
        address _to
    ) internal override {
        if (_tokenIn == JOE && _tokenOut == XJOE) {
            IxJOE(XJOE).enter(_amountIn);
        } else if (_tokenIn == XJOE && _tokenOut == JOE) {
            IxJOE(XJOE).leave(_amountIn);
        } else {
            revert("XJoeAdapter: Unsupported token");
        }
        // Confidently transfer amount-out
        _returnTo(_tokenOut, _amountOut, _to);
    }

    function setAllowances() public override {
        // Approve max xJOE and JOE for xJOE
        IERC20(XJOE).safeApprove(XJOE, UINT_MAX);
        IERC20(JOE).safeApprove(XJOE, UINT_MAX);
    }

}