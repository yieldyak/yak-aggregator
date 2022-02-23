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

import "../interface/ISAVAX.sol";
import "../lib/SafeERC20.sol";
import "../lib/SafeMath.sol";
import "../YakAdapter.sol";

interface IwAVAX {
    function withdraw(uint) external;
}

/**
 * @notice wAVAX -> SAVAX
**/
contract SAvaxAdapter is YakAdapter {
    using SafeERC20 for IERC20;
    using SafeMath for uint;

    bytes32 public constant ID = keccak256('SAvaxAdapter');
    address public constant SAVAX = 0x2b2C81e08f1Af8835a78Bb2A90AE924ACE0eA4bE;

    constructor(uint _swapGasEstimate) {
        name = 'SAvaxAdapter';
        setSwapGasEstimate(_swapGasEstimate);
        setAllowances();
    }

    function _approveIfNeeded(address _tokenIn, uint _amount) internal override {}

    function _exceedsCap(uint _amountIn) internal view returns (bool) {
        uint newBal = ISAVAX(SAVAX).totalPooledAvax().add(_amountIn);
        return newBal > ISAVAX(SAVAX).totalPooledAvaxCap();
    }

    function _query(
        uint _amountIn, 
        address _tokenIn, 
        address _tokenOut
    ) internal override view returns (uint amountOut) {  
        if (
            _tokenIn == WAVAX 
            && _tokenOut == SAVAX
            && !ISAVAX(SAVAX).mintingPaused()
            && !_exceedsCap(_amountIn)
        ) {
            amountOut = ISAVAX(SAVAX).getSharesByPooledAvax(_amountIn);
        }
    }

    function _swap(
        uint _amountIn, 
        uint _amountOut, 
        address _tokenIn, 
        address _tokenOut, 
        address _to
    ) internal override {
        IwAVAX(WAVAX).withdraw(_amountIn);
        uint shares = ISAVAX(SAVAX).submit{value: _amountIn}();
        require(shares >= _amountOut, "YakAdapter: Amount-out too low");
        _returnTo(_tokenOut, shares, _to);
    }

    function setAllowances() public override {
        IERC20(WAVAX).safeApprove(WAVAX, UINT_MAX);
    }

}