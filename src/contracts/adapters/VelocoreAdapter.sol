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

import "../interface/IERC20.sol";
import "../lib/SafeERC20.sol";
import "../YakAdapter.sol";

interface IFactory {
    function getPair(address,address,bool) external view returns (address);
}

interface IPair {
    function getAmountOut(uint256, address) external view returns (uint256);
    function swap(
        uint256 amount0Out,
        uint256 amount1Out,
        address to,
        bytes calldata data
    ) external;
}

contract VelocoreAdapter is YakAdapter {
    using SafeERC20 for IERC20;

    address immutable FACTORY;

    constructor(
        string memory _name,
        address _factory,
        uint256 _swapGasEstimate
    ) YakAdapter(_name, _swapGasEstimate) {
        FACTORY = _factory;
    }

    function getQuoteAndPair(
        uint256 _amountIn,
        address _tokenIn,
        address _tokenOut
    ) internal view returns (uint256 amountOut, address pair) {
        address stablePair = IFactory(FACTORY).getPair(_tokenIn, _tokenOut, true);
        uint amountOutStable;
        if (stablePair > address(0)) 
            amountOutStable = IPair(stablePair).getAmountOut(_amountIn, _tokenIn);
        
        pair = IFactory(FACTORY).getPair(_tokenIn, _tokenOut, false);
        if (pair > address(0))
            amountOut = IPair(pair).getAmountOut(_amountIn, _tokenIn);

        if (amountOutStable > amountOut) {
            amountOut = amountOutStable;
            pair = stablePair;
        }
    }

    function _query(
        uint256 _amountIn,
        address _tokenIn,
        address _tokenOut
    ) internal view override returns (uint256 amountOut) {
        if (_tokenIn != _tokenOut && _amountIn != 0)
            (amountOut, ) = getQuoteAndPair(_amountIn, _tokenIn, _tokenOut);
    }

    function _swap(
        uint256 _amountIn,
        uint256 _amountOut,
        address _tokenIn,
        address _tokenOut,
        address to
    ) internal override {
        (uint256 amountOut, address pair) = getQuoteAndPair(_amountIn, _tokenIn, _tokenOut);
        require(amountOut >= _amountOut, "Insufficent amount out");
        (uint256 amount0Out, uint256 amount1Out) = (_tokenIn < _tokenOut)
            ? (uint256(0), amountOut)
            : (amountOut, uint256(0));
        IERC20(_tokenIn).safeTransfer(pair, _amountIn);
        IPair(pair).swap(amount0Out, amount1Out, to, new bytes(0));
    }
}
