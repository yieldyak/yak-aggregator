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
    function getFee(address _pairAddress, bool _stable) external view returns(uint256);
    function pairCodeHash() external view returns (bytes32);
    function isGenesis(address pair) external view returns (bool);  
    function getPair(address tokenA, address token, bool stable) external view returns (address);
}

interface IPair {
    function getAmountOut(uint256, address) external view returns (uint256);
    function metadata() external view returns 
        (uint dec0, uint dec1, uint r0, uint r1, bool st, address t0, address t1);

    function swap(
        uint256,
        uint256,
        address,
        bytes calldata
    ) external;
}

contract BlackholeV1Adapter is YakAdapter {
    using SafeERC20 for IERC20;
    struct PairSwapMetadata {
        uint decimals0;
        uint decimals1;
        uint reserve0;
        uint reserve1;
        bool stable;
        address token0;
        address token1;
        uint balanceA;
        uint balanceB;
        uint reserveA;
        uint reserveB;
        uint decimalsA;
        uint decimalsB;
    }
    bytes32 immutable PAIR_CODE_HASH;
    address immutable FACTORY;

    constructor(
        string memory _name,
        address _factory,
        uint256 _swapGasEstimate
    ) YakAdapter(_name, _swapGasEstimate) {
        FACTORY = _factory;
        PAIR_CODE_HASH = getPairCodeHash(_factory);
    }

    function getPairCodeHash(address _factory) internal view returns (bytes32) {
        return IPairFactory(_factory).pairCodeHash();
    }

    function sortTokens(address tokenA, address tokenB) internal pure returns (address token0, address token1) {
        (token0, token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
    }

    // calculates the CREATE2 address for a pair without making any external calls
    function pairFor(address tokenA, address tokenB, bool stable) public view returns (address pair) {
        (address token0, address token1) = sortTokens(tokenA, tokenB);
        return IPairFactory(FACTORY).getPair(token0, token1, stable);
    }

    function _getAmoutOutSafe(address pair, uint amountIn, address tokenIn) internal view returns (uint) {
        try IPair(pair).getAmountOut(amountIn, tokenIn) returns (uint amountOut) {
            return amountOut;
        } catch {
            return 0;
        }
    }

    function getQuoteAndPair(
        uint256 _amountIn,
        address _tokenIn,
        address _tokenOut
    ) internal view returns (uint256 amountOut, address pair) {
        address pairStable = pairFor(_tokenIn, _tokenOut, true);
        address pairVolatile = pairFor(_tokenIn, _tokenOut, false);
        uint amountStable;
        uint amountVolatile;
        if (IPairFactory(FACTORY).isPair(pairStable) && !IPairFactory(FACTORY).isGenesis(pairStable)) {
            amountStable = _getAmoutOutSafe(pairStable, _amountIn, _tokenIn);
        }
        if (IPairFactory(FACTORY).isPair(pairVolatile) && !IPairFactory(FACTORY).isGenesis(pairVolatile)) {
            amountVolatile = _getAmoutOutSafe(pairVolatile, _amountIn, _tokenIn);
        }
        (amountOut, pair) = amountStable > amountVolatile ? (amountStable, pairStable) : 
            (amountVolatile, pairVolatile);
        if (pair == address(0)) {
            return (0, address(0));
        }
        return (amountOut, pair);
    }

    function _query(
        uint256 _amountIn,
        address _tokenIn,
        address _tokenOut
    ) internal view override returns (uint256 amountOut) {
        if (_tokenIn != _tokenOut && _amountIn != 0) (amountOut, ) = getQuoteAndPair(_amountIn, _tokenIn, _tokenOut);
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
