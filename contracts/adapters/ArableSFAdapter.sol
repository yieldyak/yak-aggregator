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

import "../interface/IStabilityFund.sol";
import "../interface/IERC20.sol";
import "../lib/SafeERC20.sol";
import "../lib/SafeMath.sol";
import "../YakAdapter.sol";

contract ArableSFAdapter is YakAdapter {
    using SafeERC20 for IERC20;
    using SafeMath for uint256;

    bytes32 public constant id = keccak256("ArableSFAdapter");
    address public vault;
    mapping(address => uint256) public tokenDecimals;

    constructor(
        string memory _name,
        address _vault,
        uint256 _swapGasEstimate
    ) {
        name = _name;
        vault = _vault;
        setSwapGasEstimate(_swapGasEstimate);
        setPoolTokens();
    }

    function _approveIfNeeded(address _tokenIn, uint256 _amount) internal override {}

    function setPoolTokens() public {
        uint256 whitelistedTknsLen = IStabilityFund(vault).getStableTokensCount();
        for (uint256 i = 0; i < whitelistedTknsLen; i++) {
            address token = IStabilityFund(vault).getStableTokens()[i];
            tokenDecimals[token] = IERC20(token).decimals();
            uint256 allowance = IERC20(token).allowance(address(this), vault);
            if (allowance < UINT_MAX) {
                IERC20(token).safeApprove(vault, UINT_MAX);
            }
        }
    }

    function adjustForDecimals(
        uint256 _amount,
        address _tokenDiv,
        address _tokenMul
    ) internal view returns (uint256) {
        uint256 decimalsDiv = tokenDecimals[_tokenDiv];
        uint256 decimalsMul = tokenDecimals[_tokenMul];
        return _amount.mul(10**decimalsMul) / 10**decimalsDiv;
    }

    function hasVaultEnoughBal(address _token, uint256 _amount) private view returns (bool) {
        return IERC20(_token).balanceOf(vault) >= _amount;
    }

    function _query(
        uint256 _amountIn,
        address _tokenIn,
        address _tokenOut
    ) internal view override returns (uint256) {
        if (
            _amountIn == 0 ||
            _tokenIn == _tokenOut ||
            !IStabilityFund(vault).isStableToken(_tokenIn) ||
            !IStabilityFund(vault).isStableToken(_tokenOut) ||
            IStabilityFund(vault).isTokenDisabled(_tokenIn) ||
            IStabilityFund(vault).isTokenDisabled(_tokenOut) ||
            !IStabilityFund(vault).swapEnabled()
        ) {
            return 0;
        }

        uint256 amountOut = adjustForDecimals(_amountIn, _tokenIn, _tokenOut);
        uint256 swapFee = IStabilityFund(vault).swapFee();
        uint256 swapFeeDivisor = 1 ether;
        uint256 feeAmount = amountOut.mul(swapFee) / swapFeeDivisor;
        uint256 amountOutAfterFees = amountOut.sub(feeAmount);
        if (!hasVaultEnoughBal(_tokenOut, amountOutAfterFees)) {
            return 0;
        }

        return amountOutAfterFees;
    }

    function _swap(
        uint256 _amountIn,
        uint256 _amountOut,
        address _tokenIn,
        address _tokenOut,
        address _to
    ) internal override {
        IStabilityFund(vault).swap(_tokenIn, _amountIn, _tokenOut);
        // Confidently transfer amount-out
        _returnTo(_tokenOut, _amountOut, _to);
    }

    function setAllowances() public override onlyOwner {}
}
