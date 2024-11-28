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

import "../interface/IGGAvax.sol";
import "../YakAdapter.sol";

interface IWAVAX {
    function withdraw(uint256) external;
}

/**
 * @notice WAVAX -> ggAVAX
 *
 */
contract GGAvaxAdapter is YakAdapter {
    address public constant ggAVAX = 0xA25EaF2906FA1a3a13EdAc9B9657108Af7B703e3;
    address public constant WAVAX = 0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7;

    constructor(uint256 _swapGasEstimate) YakAdapter("GGAvaxAdapter", _swapGasEstimate) {
        IERC20(WAVAX).approve(ggAVAX, type(uint256).max);
    }

    function _query(uint256 _amountIn, address _tokenIn, address _tokenOut)
        internal
        view
        override
        returns (uint256 amountOut)
    {
        if (_tokenIn == WAVAX && _tokenOut == ggAVAX) {
            if (_amountIn > IGGAvax(ggAVAX).maxDeposit(address(this))) return 0;
            return IGGAvax(ggAVAX).previewDeposit(_amountIn);
        } else if (_tokenIn == ggAVAX && _tokenOut == WAVAX) {
            amountOut = IGGAvax(ggAVAX).previewRedeem(_amountIn);
            uint256 totalAssets = IGGAvax(ggAVAX).totalAssets();
            uint256 stakingTotalAssets = IGGAvax(ggAVAX).stakingTotalAssets();
            uint256 avail = totalAssets > stakingTotalAssets ? totalAssets - stakingTotalAssets : 0;
            return amountOut > avail ? avail : amountOut;
        }
    }

    function _swap(uint256 _amountIn, uint256, address, address _tokenOut, address _to) internal override {
        if (_tokenOut == ggAVAX) {
            IGGAvax(ggAVAX).deposit(_amountIn, _to);
        } else if (_tokenOut == WAVAX) {
            IGGAvax(ggAVAX).redeem(_amountIn, _to, address(this));
        }
    }
}
