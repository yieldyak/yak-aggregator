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

import "../interface/ITMMarket.sol";
import "../interface/ITMFactory.sol";
import "../interface/IERC20.sol";
import "../lib/SafeERC20.sol";
import "../YakAdapter.sol";

contract TokenMillAdapter is YakAdapter {
    using SafeERC20 for IERC20;

    address public immutable factory;

    constructor(string memory _name, address _factory, uint256 _swapGasEstimate) YakAdapter(_name, _swapGasEstimate) {
        factory = _factory;
    }

    function _query(uint256 _amountIn, address _tokenIn, address _tokenOut)
        internal
        view
        override
        returns (uint256 amountOut)
    {
        if (_tokenIn == _tokenOut || _amountIn == 0) {
            return 0;
        }
        (bool tokenInIsBase, address market) = ITMFactory(factory).getMarket(_tokenIn, _tokenOut);

        if (market == address(0)) {
            return 0;
        }
        (int256 deltaBaseAmount, int256 deltaQuoteAmount,) =
            ITMMarket(market).getDeltaAmounts(int256(_amountIn), tokenInIsBase);
        (, amountOut) = tokenInIsBase
            ? (uint256(deltaBaseAmount), uint256(-deltaQuoteAmount))
            : (uint256(deltaQuoteAmount), uint256(-deltaBaseAmount));
    }

    function _swap(uint256 _amountIn, uint256 _amountOut, address _tokenIn, address _tokenOut, address _to)
        internal
        override
    {
        (bool b2q, address market) = ITMFactory(factory).getMarket(_tokenIn, _tokenOut);
        IERC20(_tokenIn).transfer(market, _amountIn);
        (int256 deltaBaseAmount, int256 deltaQuoteAmount) =
            ITMMarket(market).swap(_to, int256(_amountIn), b2q, "", address(0));

        (, uint256 amountOut) = b2q
            ? (uint256(deltaBaseAmount), uint256(-deltaQuoteAmount))
            : (uint256(deltaQuoteAmount), uint256(-deltaBaseAmount));
        require(uint256(amountOut) >= _amountOut, "TokenMillAdapter: insufficient amount out");
    }
}
