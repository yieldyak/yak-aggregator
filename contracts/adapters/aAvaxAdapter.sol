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
    function withdraw(uint256) external;
}

/**
 * @notice wAVAX -> SAVAX
 **/
contract SAvaxAdapter is YakAdapter {
    using SafeERC20 for IERC20;
    using SafeMath for uint256;

    bytes32 public constant ID = keccak256("SAvaxAdapter");
    address public constant SAVAX = 0x2b2C81e08f1Af8835a78Bb2A90AE924ACE0eA4bE;

    constructor(uint256 _swapGasEstimate) {
        name = "SAvaxAdapter";
        setSwapGasEstimate(_swapGasEstimate);
        setAllowances();
    }

    function _approveIfNeeded(address _tokenIn, uint256 _amount)
        internal
        override
    {}

    function _exceedsCap(uint256 _amountIn) internal view returns (bool) {
        uint256 newBal = ISAVAX(SAVAX).totalPooledAvax().add(_amountIn); // Assume U256::max won't be reached
        return newBal > ISAVAX(SAVAX).totalPooledAvaxCap();
    }

    function _query(
        uint256 _amountIn,
        address _tokenIn,
        address _tokenOut
    ) internal view override returns (uint256 amountOut) {
        if (
            _tokenIn == WAVAX &&
            _tokenOut == SAVAX &&
            !ISAVAX(SAVAX).mintingPaused() &&
            !_exceedsCap(_amountIn)
        ) {
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

    function setAllowances() public override {
        IERC20(WAVAX).safeApprove(WAVAX, UINT_MAX);
    }
}
