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
pragma solidity ^0.8.0;

import "../interface/ISAVAX.sol";
import "../lib/SafeERC20.sol";
import "../YakAdapter.sol";

interface IwAVAX {
    function withdraw(uint256) external;
}

/**
 * @notice wAVAX -> sAVAX
 **/
contract SAvaxAdapter is YakAdapter {
    using SafeERC20 for IERC20;

    address public constant SAVAX = 0x2b2C81e08f1Af8835a78Bb2A90AE924ACE0eA4bE;
    address public constant WAVAX = 0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7;

    constructor(uint256 _swapGasEstimate) YakAdapter("SAvaxAdapter", _swapGasEstimate) {
        _setAllowances();
    }

    function _query(
        uint256 _amountIn,
        address _tokenIn,
        address _tokenOut
    ) internal view override returns (uint256 amountOut) {
        if (_tokenIn == WAVAX && _tokenOut == SAVAX && !ISAVAX(SAVAX).mintingPaused() && !_exceedsCap(_amountIn)) {
            amountOut = ISAVAX(SAVAX).getSharesByPooledAvax(_amountIn);
        }
    }

    function _swap(
        uint256 _amountIn,
        uint256 _amountOut,
        address,
        address _tokenOut,
        address _to
    ) internal override {
        IwAVAX(WAVAX).withdraw(_amountIn);
        uint256 shares = ISAVAX(SAVAX).submit{ value: _amountIn }();
        require(shares >= _amountOut, "YakAdapter: Amount-out too low");
        _returnTo(_tokenOut, shares, _to);
    }

    function _exceedsCap(uint256 _amountIn) internal view returns (bool) {
        uint256 newBal = ISAVAX(SAVAX).totalPooledAvax() + _amountIn; // Assume U256::max won't be reached
        return newBal > ISAVAX(SAVAX).totalPooledAvaxCap();
    }

    function _setAllowances() internal {
        IERC20(WAVAX).safeApprove(WAVAX, UINT_MAX);
    }
}
