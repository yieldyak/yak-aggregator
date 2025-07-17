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

import "../interface/IKyberPool.sol";
import "../interface/IERC20.sol";
import "../lib/SafeERC20.sol";
import "../YakAdapter.sol";

contract KyberAdapter is YakAdapter {
    using SafeERC20 for IERC20;

    uint256 public constant PRECISION = 1e18;
    mapping(address => mapping(address => address)) internal TKNS_TO_POOL;

    constructor(
        string memory _name,
        address[] memory _pools,
        uint256 _swapGasEstimate
    ) YakAdapter(_name, _swapGasEstimate) {
        addPools(_pools);
    }

    function addPools(address[] memory _pools) public onlyMaintainer {
        // Note: Overrides existing if pool has same tkns but different APR
        for (uint256 i = 0; i < _pools.length; i++) {
            address tkn0 = IKyberPool(_pools[i]).token0();
            address tkn1 = IKyberPool(_pools[i]).token1();
            TKNS_TO_POOL[tkn0][tkn1] = _pools[i];
            TKNS_TO_POOL[tkn1][tkn0] = _pools[i];
        }
    }

    function removePools(address[] memory _pools) public onlyMaintainer {
        // Note: Overrides existing if pool has same tkns but different APR
        for (uint256 i = 0; i < _pools.length; i++) {
            address tkn0 = IKyberPool(_pools[i]).token0();
            address tkn1 = IKyberPool(_pools[i]).token1();
            TKNS_TO_POOL[tkn0][tkn1] = address(0);
            TKNS_TO_POOL[tkn1][tkn0] = address(0);
        }
    }

    function getPool(address tkn0, address tkn1) public view returns (address) {
        return TKNS_TO_POOL[tkn0][tkn1];
    }

    function _getAmountOut(
        uint256 amountIn,
        uint256 vReserveIn,
        uint256 vReserveOut,
        uint256 feeInPrecision
    ) internal pure returns (uint256 amountOut) {
        // Based on https://github.com/dynamic-amm/smart-contracts/blob/master/contracts/libraries/DMMLibrary.sol
        uint256 amountInWithFee = (amountIn * (PRECISION - feeInPrecision)) / PRECISION;
        uint256 numerator = amountInWithFee * vReserveOut;
        uint256 denominator = vReserveIn + amountInWithFee;
        amountOut = numerator / denominator;
    }

    function _query(
        uint256 _amountIn,
        address _tokenIn,
        address _tokenOut
    ) internal view override returns (uint256 amountOut) {
        if (_tokenIn == _tokenOut || _amountIn == 0) {
            return 0;
        }
        address pool = getPool(_tokenIn, _tokenOut);
        if (pool == address(0)) {
            return 0;
        }
        (uint112 r0, uint112 r1, uint112 vr0, uint112 vr1, uint256 feeInPrecision) = IKyberPool(pool).getTradeInfo();
        (uint112 reserveIn, uint112 reserveOut) = _tokenIn < _tokenOut ? (r0, r1) : (r1, r0);
        (uint112 vReserveIn, uint112 vReserveOut) = _tokenIn < _tokenOut ? (vr0, vr1) : (vr1, vr0);
        if (reserveIn > 0 && reserveOut > 0) {
            uint256 _amountOut = _getAmountOut(_amountIn, vReserveIn, vReserveOut, feeInPrecision);
            if (reserveOut > amountOut) amountOut = _amountOut;
        }
    }

    function _swap(
        uint256 _amountIn,
        uint256 _amountOut,
        address _tokenIn,
        address _tokenOut,
        address to
    ) internal override {
        address pair = getPool(_tokenIn, _tokenOut);
        (uint256 amount0Out, uint256 amount1Out) = (_tokenIn < _tokenOut)
            ? (uint256(0), _amountOut)
            : (_amountOut, uint256(0));
        IERC20(_tokenIn).safeTransfer(pair, _amountIn);
        IKyberPool(pair).swap(amount0Out, amount1Out, to, new bytes(0));
    }
}
