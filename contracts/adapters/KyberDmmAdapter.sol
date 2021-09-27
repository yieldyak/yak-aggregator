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

import "../interface/IKyberDMMFactory.sol";
import "../interface/IKyberPool.sol";
import "../interface/IERC20.sol";
import "../lib/SafeERC20.sol";
import "../lib/SafeMath.sol";
import "../YakAdapter.sol";

contract KyberDmmAdapter is YakAdapter {
    using SafeERC20 for IERC20;
    using SafeMath for uint256;

    bytes32 public constant ID = keccak256("KyberDmmAdapter");
    address public immutable factory;
    uint256 public constant PRECISION = 1e18;

    constructor(
        string memory _name,
        address _factory,
        uint256 _swapGasEstimate
    ) {
        factory = _factory;
        name = _name;
        setSwapGasEstimate(_swapGasEstimate);
        setAllowances();
    }

    function setAllowances() public override onlyOwner {
        IERC20(WAVAX).safeApprove(WAVAX, UINT_MAX);
    }

    function _approveIfNeeded(address tokenIn, uint256 amount)
        internal
        override
    {}

    function _getAmountOut(
        uint256 amountIn,
        uint256 vReserveIn,
        uint256 vReserveOut,
        uint256 feeInPrecision
    ) internal pure returns (uint256 amountOut) {
        // Based on https://github.com/dynamic-amm/smart-contracts/blob/master/contracts/libraries/DMMLibrary.sol
        uint256 amountInWithFee = amountIn.mul(PRECISION.sub(feeInPrecision))/(PRECISION);
        uint256 numerator = amountInWithFee.mul(vReserveOut);
        uint256 denominator = vReserveIn.add(amountInWithFee);
        amountOut = numerator / denominator;
    }

    function _query(
        uint256 _amountIn,
        address _tokenIn,
        address _tokenOut
    ) internal view override returns (uint256) {
        if (_tokenIn == _tokenOut || _amountIn == 0) {
            return 0;
        }
        address pool = IDMMFactory(factory).getUnamplifiedPool(
            IERC20(_tokenIn),
            IERC20(_tokenOut)
        );
        if (pool == address(0)) {
            return 0;
        }
        (
            uint112 _vR0,
            uint112 _vR1,
            uint112 r0,
            uint112 r1,
            uint256 feeInPrecision
        ) = IDMMPool(pool).getTradeInfo();
        (uint112 reserveIn, uint112 reserveOut) = _tokenIn < _tokenOut
            ? (r0, r1)
            : (r1, r0);
        (uint112 vReserveIn, uint112 vReserveOut) = _tokenIn < _tokenOut
            ? (_vR0, _vR1)
            : (_vR1, _vR0);
        if (reserveIn > 0 && reserveOut > 0) {
            uint256 amountOut = _getAmountOut(
                _amountIn,
                vReserveIn,
                vReserveOut,
                feeInPrecision
            );
            if (reserveOut > amountOut) return amountOut;
            else return 0;
        }
    }

    function _swap(
        uint256 _amountIn,
        uint256 _amountOut,
        address _tokenIn,
        address _tokenOut,
        address to
    ) internal override {
        address pool = IDMMFactory(factory).getUnamplifiedPool(IERC20(_tokenIn), IERC20(_tokenOut));
        (uint256 amount0Out, uint256 amount1Out) = (_tokenIn < _tokenOut)
            ? (uint256(0), _amountOut)
            : (_amountOut, uint256(0));
        IERC20(_tokenIn).safeTransfer(pool, _amountIn);
        IDMMPool(pool).swap(amount0Out, amount1Out, to, new bytes(0));
    }
}
