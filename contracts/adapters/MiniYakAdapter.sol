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

import "../interface/ImYAK.sol";
import "../lib/SafeERC20.sol";
import "../lib/SafeMath.sol";
import "../YakAdapter.sol";

contract MiniYakAdapter is YakAdapter {
    using SafeERC20 for IERC20;
    using SafeMath for uint256;

    bytes32 public constant ID = keccak256("MiniYakAdapter");
    address public constant YAK = 0x59414b3089ce2AF0010e7523Dea7E2b35d776ec7;
    address public constant mYAK = 0xdDAaAD7366B455AfF8E7c82940C43CEB5829B604;

    constructor(uint256 _swapGasEstimate) {
        setSwapGasEstimate(_swapGasEstimate);
        setAllowances();
    }

    function _approveIfNeeded(address _tokenIn, uint256 _amount)
        internal
        override
    {}

    function _query(
        uint256 _amountIn,
        address _tokenIn,
        address _tokenOut
    ) internal pure override returns (uint256 amountOut) {
        if (
            (_tokenIn == mYAK && _tokenOut == YAK) ||
            (_tokenIn == YAK && _tokenOut == mYAK)
        ) {
            amountOut = _amountIn;
        }
    }

    function _swap(
        uint256 _amountIn,
        uint256,
        address _tokenIn,
        address _tokenOut,
        address _to
    ) internal override {
        if (_tokenIn == mYAK && _tokenOut == YAK) {
            ImYAK(mYAK).unmoon(_amountIn, _to);
        } else if (_tokenIn == YAK && _tokenOut == mYAK) {
            ImYAK(mYAK).moon(_amountIn, _to);
        } else {
            revert("Unsupported token");
        }
    }

    function setAllowances() public override {
        // Approve max for mYak and Yak
        IERC20(mYAK).safeApprove(mYAK, UINT_MAX);
        IERC20(YAK).safeApprove(mYAK, UINT_MAX);
    }
}
