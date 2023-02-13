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

import "./interface/IYakRouter.sol";
import "./interface/IWrapper.sol";
import "./lib/Maintainable.sol";
import "./lib/YakViewUtils.sol";

contract YakWrapRouter is Maintainable {
    using FormattedOfferUtils for FormattedOffer;
    using OfferUtils for Offer;

    IYakRouter public router;

    constructor(address _router) {
        setRouter(_router);
    }

    function setRouter(address _router) public onlyMaintainer {
        router = IYakRouter(_router);
    }

    function findBestPathAndWrap(
        uint256 amountIn,
        address tokenIn,
        address wrapper,
        uint256 maxSteps,
        uint256 gasPrice
    ) external view returns (FormattedOffer memory bestOffer) {
        address[] memory wrapperTokenIn = IWrapper(wrapper).getTokensIn();
        address wrappedToken = IWrapper(wrapper).getWrappedToken();
        uint256 gasEstimate = IWrapper(wrapper).swapGasEstimate();

        for (uint256 i; i < wrapperTokenIn.length; ++i) {
            FormattedOffer memory offer;
            uint256 wrappedAmountOut;
            if (wrapperTokenIn[i] != tokenIn) {
                offer = router.findBestPathWithGas(amountIn, tokenIn, wrapperTokenIn[i], maxSteps, gasPrice);
                wrappedAmountOut = IWrapper(wrapper).query(
                    offer.amounts[offer.amounts.length - 1],
                    wrapperTokenIn[i],
                    wrappedToken
                );
            } else {
                wrappedAmountOut = IWrapper(wrapper).query(amountIn, tokenIn, wrappedToken);
                Offer memory query = OfferUtils.newOffer(amountIn, tokenIn);
                offer = query.format();
            }

            if (i == 0 || wrappedAmountOut > bestOffer.getAmountOut()) {
                offer.addToTail(wrappedAmountOut, wrapper, wrappedToken, gasEstimate);
                bestOffer = offer;
            }
        }
    }

    function unwrapAndFindBestPath(
        uint256 amountIn,
        address tokenOut,
        address wrapper,
        uint256 maxSteps,
        uint256 gasPrice
    ) external view returns (FormattedOffer memory bestOffer) {
        address[] memory wrapperTokenOut = IWrapper(wrapper).getTokensOut();
        address wrappedToken = IWrapper(wrapper).getWrappedToken();
        uint256 gasEstimate = IWrapper(wrapper).swapGasEstimate();

        for (uint256 i; i < wrapperTokenOut.length; ++i) {
            uint256 amountOut = IWrapper(wrapper).query(amountIn, wrappedToken, wrapperTokenOut[i]);
            FormattedOffer memory offer;
            if (wrapperTokenOut[i] != tokenOut) {
                offer = router.findBestPathWithGas(amountOut, wrapperTokenOut[i], tokenOut, maxSteps, gasPrice);
                amountOut = offer.getAmountOut();
            } else {
                Offer memory query = OfferUtils.newOffer(amountIn, wrappedToken);
                offer = query.format();
            }

            if (i == 0 || amountOut > bestOffer.getAmountOut()) {
                if (wrapperTokenOut[i] != tokenOut) {
                    offer.addToHead(amountIn, wrapper, wrappedToken, gasEstimate);
                } else {
                    offer.addToTail(amountOut, wrapper, tokenOut, gasEstimate);
                }
                bestOffer = offer;
            }
        }
    }
}
