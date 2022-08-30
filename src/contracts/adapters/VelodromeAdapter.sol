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

import "../interface/IERC20.sol";
import "../lib/SafeERC20.sol";
import "../lib/SafeMath.sol";
import "../YakAdapter.sol";

interface IPairFactory {
    function isPair(address) external view returns (bool);
    function pairCodeHash() external view returns (bytes32);
}

interface IPair {
    function getAmountOut(uint, address) external view returns (uint);
    function swap(uint, uint, address, bytes calldata) external;
}

contract VelodromeAdapter is YakAdapter {
    using SafeERC20 for IERC20;
    using SafeMath for uint;

    bytes32 immutable PAIR_CODE_HASH;
    address immutable FACTORY;

    constructor(
        string memory _name, 
        address _factory, 
        uint _swapGasEstimate
    ) YakAdapter(_name, _swapGasEstimate) {
        FACTORY = _factory;
        PAIR_CODE_HASH = getPairCodeHash(_factory);
    }

    function getPairCodeHash(address _factory) internal view returns (bytes32) {
        return IPairFactory(_factory).pairCodeHash();
    }

    function sortTokens(
        address tokenA, 
        address tokenB
    ) internal pure returns (address token0, address token1) {
        (token0, token1) = tokenA < tokenB 
            ? (tokenA, tokenB) 
            : (tokenB, tokenA);
    }

    // calculates the CREATE2 address for a pair without making any external calls
    function pairFor(address tokenA, address tokenB, bool stable) internal view returns (address pair) {
        (address token0, address token1) = sortTokens(tokenA, tokenB);
        pair = address(uint160(uint256(keccak256(abi.encodePacked(
            hex'ff',
            FACTORY,
            keccak256(abi.encodePacked(token0, token1, stable)),
            PAIR_CODE_HASH
        )))));
    }
    
    function getQuoteAndPair(
        uint _amountIn, 
        address _tokenIn, 
        address _tokenOut
    ) internal view returns (uint amountOut, address pair) {
        address pairStable = pairFor(_tokenIn, _tokenOut, true);
        uint amountStable;
        uint amountVolatile;
        if (IPairFactory(FACTORY).isPair(pairStable)) {
            amountStable = IPair(pairStable).getAmountOut(_amountIn, _tokenIn);
        }
        address pairVolatile = pairFor(_tokenIn, _tokenOut, false);
        if (IPairFactory(FACTORY).isPair(pairVolatile)) {
            amountVolatile = IPair(pairVolatile).getAmountOut(_amountIn, _tokenIn);
        }
        (amountOut, pair) = amountStable > amountVolatile 
            ? (amountStable, pairStable) 
            : (amountVolatile, pairVolatile);
    }

    function _query(
        uint _amountIn, 
        address _tokenIn, 
        address _tokenOut
    ) internal override view returns (uint amountOut) {
        if (_tokenIn != _tokenOut && _amountIn != 0)
            (amountOut,) = getQuoteAndPair(_amountIn, _tokenIn, _tokenOut);
    }

    function _swap(
        uint _amountIn, 
        uint _amountOut, 
        address _tokenIn, 
        address _tokenOut, 
        address to
    ) internal override {
        (uint amountOut, address pair) = getQuoteAndPair(_amountIn, _tokenIn, _tokenOut);
        require(amountOut >= _amountOut, "Insufficent amount out");
        (uint amount0Out, uint amount1Out) = (_tokenIn < _tokenOut) 
            ? (uint(0), amountOut) 
            : (amountOut, uint(0));
        IERC20(_tokenIn).safeTransfer(pair, _amountIn);
        IPair(pair).swap(
            amount0Out, 
            amount1Out,
            to, 
            new bytes(0)
        );
    }
}