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

interface IPairFactory {
    function isPair(address) external view returns (bool);
    function getPair(address, address, bool) external view returns (address);

    function pairCodeHash() external view returns (bytes32);
}

interface IPair {
    function getAmountOut(uint256, address) external view returns (uint256);

    function swap(uint256, uint256, address, bytes calldata) external;
}

contract BlackholeAdapter is YakAdapter {
    using SafeERC20 for IERC20;

    address immutable FACTORY;

    constructor(string memory _name, address _factory, uint256 _swapGasEstimate) YakAdapter(_name, _swapGasEstimate) {
        FACTORY = _factory;
    }

    function _getAmoutOutSafe(address pair, uint256 amountIn, address tokenIn) internal view returns (uint256) {
        try IPair(pair).getAmountOut(amountIn, tokenIn) returns (uint256 amountOut) {
            return amountOut;
        } catch {
            return 0;
        }
    }

    function getQuoteAndPair(uint256 _amountIn, address _tokenIn, address _tokenOut)
        internal
        view
        returns (uint256 amountOut, address pair)
    {
        address pairStable = IPairFactory(FACTORY).getPair(_tokenIn, _tokenOut, true);
        uint256 amountStable;
        uint256 amountVolatile;
        if (IPairFactory(FACTORY).isPair(pairStable)) {
            amountStable = _getAmoutOutSafe(pairStable, _amountIn, _tokenIn);
        }
        address pairVolatile = IPairFactory(FACTORY).getPair(_tokenIn, _tokenOut, false);
        if (IPairFactory(FACTORY).isPair(pairVolatile)) {
            amountVolatile = _getAmoutOutSafe(pairVolatile, _amountIn, _tokenIn);
        }
        (amountOut, pair) = amountStable > amountVolatile ? (amountStable, pairStable) : (amountVolatile, pairVolatile);
    }

    function _query(uint256 _amountIn, address _tokenIn, address _tokenOut)
        internal
        view
        override
        returns (uint256 amountOut)
    {
        if (_tokenIn != _tokenOut && _amountIn != 0) (amountOut,) = getQuoteAndPair(_amountIn, _tokenIn, _tokenOut);
    }

    function _swap(uint256 _amountIn, uint256 _amountOut, address _tokenIn, address _tokenOut, address to)
        internal
        override
    {
        (uint256 amountOut, address pair) = getQuoteAndPair(_amountIn, _tokenIn, _tokenOut);
        require(amountOut >= _amountOut, "Insufficent amount out");
        (uint256 amount0Out, uint256 amount1Out) =
            (_tokenIn < _tokenOut) ? (uint256(0), amountOut) : (amountOut, uint256(0));
        IERC20(_tokenIn).safeTransfer(pair, _amountIn);
        IPair(pair).swap(amount0Out, amount1Out, to, new bytes(0));
    }
}
