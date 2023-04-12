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


import "../YakAdapter.sol";
import "../interface/IERC20.sol";
import "../lib/SafeERC20.sol";
import "../interface/ILBFactory.sol";
import "../interface/ILB2Pair.sol";

struct LBQuote {
    uint256 amountOut;
    address pair;
    bool swapForY;
}

contract LB2Adapter is YakAdapter {
    using SafeERC20 for IERC20;

    address public immutable FACTORY;
    bool public allowIgnoredPairs = true;
    bool public allowExternalPairs = true;
    uint256 public quoteGasLimit = 600_000;

    constructor(
        string memory _name,
        uint256 _swapGasEstimate,
        uint256 _quoteGasLimit,
        address _factory
    ) YakAdapter(_name, _swapGasEstimate) {
        setQuoteGasLimit(_quoteGasLimit);
        FACTORY = _factory;
    }

    function setAllowIgnoredPairs(bool _allowIgnoredPairs) external onlyMaintainer {
        allowIgnoredPairs = _allowIgnoredPairs;
    }

    function setAllowExternalPairs(bool _allowExternalPairs) external onlyMaintainer {
        allowExternalPairs = _allowExternalPairs;
    }

    function setQuoteGasLimit(uint256 _quoteGasLimit) public onlyMaintainer {
        quoteGasLimit = _quoteGasLimit;
    }

    function _query(
        uint256 _amountIn,
        address _tokenIn,
        address _tokenOut
    ) internal view override returns (uint256 amountOut) {
        (amountOut, , ) = _getBestQuote(_amountIn, _tokenIn, _tokenOut);
    }

    function _swap(
        uint256 _amountIn,
        uint256 _minAmountOut,
        address _tokenIn,
        address _tokenOut,
        address to
    ) internal override {
        (uint256 amountOut, address pair, bool swapForY) = _getBestQuote(_amountIn, _tokenIn, _tokenOut);
        require(amountOut >= _minAmountOut, "LBAdapter: insufficient amountOut received");
        IERC20(_tokenIn).transfer(pair, _amountIn);
        ILBPair(pair).swap(swapForY, to);
    }

    function _getBestQuote(
        uint256 _amountIn,
        address _tokenIn,
        address _tokenOut
    )
        internal
        view
        returns (
            uint256 amountOut,
            address pair,
            bool swapForY
        )
    {
        ILBFactory.LBPairInformation[] memory LBPairsAvailable = ILBFactory(FACTORY).getAllLBPairs(_tokenIn, _tokenOut);

        if (LBPairsAvailable.length > 0 && _amountIn > 0) {
            for (uint256 i; i < LBPairsAvailable.length; ++i) {
                if (!LBPairsAvailable[i].ignoredForRouting && !allowIgnoredPairs) {
                    continue;
                }
                if (!LBPairsAvailable[i].createdByOwner && !allowExternalPairs) {
                    continue;
                }

                swapForY = ILBPair(LBPairsAvailable[i].LBPair).getTokenY() == _tokenOut;
                uint256 swapAmountOut = getQuote(LBPairsAvailable[i].LBPair, _amountIn, swapForY);

                if (swapAmountOut > amountOut) {
                    amountOut = swapAmountOut;
                    pair = LBPairsAvailable[i].LBPair;
                }
            }
        }
    }

    function getQuote(
        address pair,
        uint256 amountIn,
        bool swapForY
    ) internal view returns (uint256 out) {
        try ILBPair(pair).getSwapOut{gas: quoteGasLimit}(
            uint128(amountIn), 
            swapForY
        ) returns (uint128 amountInLeft, uint128 amountOut, uint128) {
            if (amountInLeft == 0) {
                out = amountOut;
            }
        } catch {}
    }
}
