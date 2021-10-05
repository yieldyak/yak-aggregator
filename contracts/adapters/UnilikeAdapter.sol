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

import "../interface/IUnilikeFactory.sol";
import "../interface/IUnilikePair.sol";
import "../interface/IERC20.sol";
import "../lib/SafeERC20.sol";
import "../lib/SafeMath.sol";
import "../YakAdapter.sol";

contract UnilikeAdapter is YakAdapter {
    using SafeERC20 for IERC20;
    using SafeMath for uint;

    bytes32 public constant ID = keccak256("UnilikeAdapter");
    // todo: overriding FEE_DENOMINATOR should probably be handled differently? 
    uint internal OVERRIDE_FEE_DENOMINATOR = 1e3;
    uint public immutable feeCompliment;
    address public immutable factory;

    constructor(
        string memory _name, 
        address _factory, 
        uint _fee,
        uint _swapGasEstimate
    ) {
        require(OVERRIDE_FEE_DENOMINATOR > _fee, 'YakUnilikeAdapter: Fee greater than the denominator');
        factory = _factory;
        name = _name;
        feeCompliment = OVERRIDE_FEE_DENOMINATOR.sub(_fee);
        setSwapGasEstimate(_swapGasEstimate);
        setAllowances();
    }

    function setAllowances() public override onlyOwner {
        IERC20(WAVAX).safeApprove(WAVAX, UINT_MAX);
    }

    function _approveIfNeeded(address tokenIn, uint amount) internal override {}

    function _getAmountOut(
        uint _amountIn, 
        uint _reserveIn, 
        uint _reserveOut
    ) internal view returns (uint amountOut) {
        // Based on https://github.com/Uniswap/uniswap-v2-periphery/blob/master/contracts/UniswapV2Router02.sol
        uint amountInWithFee = _amountIn.mul(feeCompliment);
        uint numerator = amountInWithFee.mul(_reserveOut);
        uint denominator = _reserveIn.mul(OVERRIDE_FEE_DENOMINATOR).add(amountInWithFee);
        amountOut = numerator / denominator;
    }

    function _query(
        uint _amountIn, 
        address _tokenIn, 
        address _tokenOut
    ) internal override view returns (uint) {
        if (_tokenIn == _tokenOut || _amountIn==0) { return 0; }
        address pair = IUnilikeFactory(factory).getPair(_tokenIn, _tokenOut);
        if (pair == address(0)) { return 0; }
        (uint r0, uint r1, ) = IUnilikePair(pair).getReserves();
        (uint reserveIn, uint reserveOut) = _tokenIn < _tokenOut ? (r0, r1) : (r1, r0);
        if (reserveIn > 0 && reserveOut > 0) {
            return _getAmountOut(_amountIn, reserveIn, reserveOut);
        }
    }

    function _swap(
        uint _amountIn, 
        uint _amountOut, 
        address _tokenIn, 
        address _tokenOut, 
        address to
    ) internal override {
        address pair = IUnilikeFactory(factory).getPair(_tokenIn, _tokenOut);
        (uint amount0Out, uint amount1Out) = (_tokenIn < _tokenOut) ? (uint(0), _amountOut) : (_amountOut, uint(0));
        IERC20(_tokenIn).safeTransfer(pair, _amountIn);
        IUnilikePair(pair).swap(
            amount0Out, 
            amount1Out,
            to, 
            new bytes(0)
        );
    }
}