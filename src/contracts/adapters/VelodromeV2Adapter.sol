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
    function isPool(address) external view returns (bool);

    function implementation() external view returns (address);
}

interface IPair {
    function getAmountOut(uint256, address) external view returns (uint256);

    function swap(
        uint256,
        uint256,
        address,
        bytes calldata
    ) external;
}

contract VelodromeV2Adapter is YakAdapter {
    using SafeERC20 for IERC20;

    address immutable FACTORY;

    constructor(
        string memory _name,
        address _factory,
        uint256 _swapGasEstimate
    ) YakAdapter(_name, _swapGasEstimate) {
        FACTORY = _factory;
    }

    function sortTokens(address tokenA, address tokenB) internal pure returns (address token0, address token1) {
        (token0, token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
    }

    // calculates the CREATE2 address for a pair without making any external calls
    function pairFor(
        address tokenA,
        address tokenB,
        bool stable
    ) internal view returns (address pair) {
        (address token0, address token1) = sortTokens(tokenA, tokenB);
        bytes32 salt = keccak256(abi.encodePacked(token0, token1, stable));
        pair = predictDeterministicAddress(IPairFactory(FACTORY).implementation(), salt, FACTORY);
    }

    function predictDeterministicAddress(
        address implementation,
        bytes32 salt,
        address deployer
    ) internal pure returns (address predicted) {
        /// @solidity memory-safe-assembly
        assembly {
            let ptr := mload(0x40)
            mstore(add(ptr, 0x38), deployer)
            mstore(add(ptr, 0x24), 0x5af43d82803e903d91602b57fd5bf3ff)
            mstore(add(ptr, 0x14), implementation)
            mstore(ptr, 0x3d602d80600a3d3981f3363d3d373d3d3d363d73)
            mstore(add(ptr, 0x58), salt)
            mstore(add(ptr, 0x78), keccak256(add(ptr, 0x0c), 0x37))
            predicted := keccak256(add(ptr, 0x43), 0x55)
        }
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
        uint256 amountStable;
        uint256 amountVolatile;
        if (IPairFactory(FACTORY).isPool(pairStable)) {
            amountStable = _getAmoutOutSafe(pairStable, _amountIn, _tokenIn);
        }
        address pairVolatile = pairFor(_tokenIn, _tokenOut, false);
        if (IPairFactory(FACTORY).isPool(pairVolatile)) {
            amountVolatile = _getAmoutOutSafe(pairVolatile, _amountIn, _tokenIn);
        }
        (amountOut, pair) = amountStable > amountVolatile ? (amountStable, pairStable) : (amountVolatile, pairVolatile);
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
