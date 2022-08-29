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

import "../interface/IGmxVault.sol";
import "../interface/IERC20.sol";
import "../lib/SafeERC20.sol";
import "../lib/SafeMath.sol";
import "../YakAdapter.sol";

contract GmxAdapter is YakAdapter {
    using SafeERC20 for IERC20;
    using SafeMath for uint256;

    bytes32 public constant id = keccak256("GmxAdapter");
    address public constant USDG = 0xc0253c3cC6aa5Ab407b5795a04c28fB063273894;
    uint256 public constant BASIS_POINTS_DIVISOR = 1e4;
    uint256 public constant PRICE_PRECISION = 1e30;
    uint256 public constant USDG_DECIMALS = 18;
    address public vault;
    mapping(address => uint256) public tokenDecimals;
    mapping(address => bool) public isPoolToken;

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

    function _approveIfNeeded(address _tokenIn, uint256 _amount) internal override {
        uint256 allowance = IERC20(_tokenIn).allowance(address(this), vault);
        if (allowance < _amount) {
            IERC20(_tokenIn).safeApprove(vault, UINT_MAX);
        }
    }

    function setPoolTokens() public {
        uint256 whitelistedTknsLen = IGmxVault(vault).allWhitelistedTokensLength();
        for (uint256 i = 0; i < whitelistedTknsLen; i++) {
            address token = IGmxVault(vault).allWhitelistedTokens(i);
            tokenDecimals[token] = IERC20(token).decimals();
            isPoolToken[token] = true;
        }
    }

    function adjustForDecimals(
        uint256 _amount,
        address _tokenDiv,
        address _tokenMul
    ) internal view returns (uint256) {
        uint256 decimalsDiv = _tokenDiv == USDG ? USDG_DECIMALS : tokenDecimals[_tokenDiv];
        uint256 decimalsMul = _tokenMul == USDG ? USDG_DECIMALS : tokenDecimals[_tokenMul];
        return _amount.mul(10**decimalsMul) / 10**decimalsDiv;
    }

    function getPrices(address _tokenIn, address _tokenOut) internal view returns (uint256 priceIn, uint256 priceOut) {
        IGmxVaultPriceFeed priceFeed = IGmxVault(vault).priceFeed();
        priceIn = priceFeed.getPrice(_tokenIn, false, true, true);
        priceOut = priceFeed.getPrice(_tokenOut, true, true, true);
    }

    function hasVaultEnoughBal(address _token, uint256 _amount) private view returns (bool) {
        return IERC20(_token).balanceOf(vault) >= _amount;
    }

    function isWithinVaultLimits(
        address _tokenIn,
        address _tokenOut,
        uint256 _amountInUsdg,
        uint256 _amountOut
    ) private view returns (bool withinVaultLimits) {
        // Check pool balance is not exceeded
        uint256 poolBalTknOut = IGmxVault(vault).poolAmounts(_tokenOut);
        if (poolBalTknOut < _amountOut) return false;
        // Check if amountOut exceeds reserved amount
        uint256 newPoolBalTknOut = poolBalTknOut.sub(_amountOut);
        uint256 reservedAmount = IGmxVault(vault).reservedAmounts(_tokenOut);
        bool reservedAmountNotExceeded = newPoolBalTknOut >= reservedAmount;
        // Check if amountOut exceeds buffer amount
        uint256 bufferAmount = IGmxVault(vault).bufferAmounts(_tokenOut);
        bool bufferAmountNotExceeded = newPoolBalTknOut >= bufferAmount;
        // Check if amountIn(usdg) exceeds max debt
        uint256 newUsdgAmount = IGmxVault(vault).usdgAmounts(_tokenIn).add(_amountInUsdg);
        uint256 maxUsdgAmount = IGmxVault(vault).maxUsdgAmounts(_tokenIn);
        bool maxDebtNotExceeded = newUsdgAmount <= maxUsdgAmount;

        if (reservedAmountNotExceeded && bufferAmountNotExceeded && maxDebtNotExceeded) {
            withinVaultLimits = true;
        }
    }

    function _query(
        uint256 _amountIn,
        address _tokenIn,
        address _tokenOut
    ) internal view override returns (uint256 amountOut) {
        if (
            _amountIn == 0 ||
            _tokenIn == _tokenOut ||
            !IGmxVault(vault).whitelistedTokens(_tokenIn) ||
            !IGmxVault(vault).whitelistedTokens(_tokenOut) ||
            !IGmxVault(vault).isSwapEnabled() ||
            !hasVaultEnoughBal(_tokenIn, 1)
        ) {
            return 0;
        }

        (uint256 priceIn, uint256 priceOut) = getPrices(_tokenIn, _tokenOut);
        uint256 _amountOut = _amountIn.mul(priceIn) / priceOut;
        _amountOut = adjustForDecimals(_amountOut, _tokenIn, _tokenOut);
        uint256 usdgAmount = _amountIn.mul(priceIn) / PRICE_PRECISION;
        usdgAmount = adjustForDecimals(usdgAmount, _tokenIn, USDG);
        uint256 feeBasisPoints = IGmxVault(vault).vaultUtils().getSwapFeeBasisPoints(_tokenIn, _tokenOut, usdgAmount);
        uint256 amountOutAfterFees = _amountOut.mul(BASIS_POINTS_DIVISOR.sub(feeBasisPoints)) / BASIS_POINTS_DIVISOR;
        bool withinVaultLimits = isWithinVaultLimits(_tokenIn, _tokenOut, usdgAmount, amountOutAfterFees);
        if (withinVaultLimits) {
            amountOut = amountOutAfterFees;
        }
    }

    function _swap(
        uint256 _amountIn,
        uint256 _amountOut,
        address _tokenIn,
        address _tokenOut,
        address _to
    ) internal override {
        IERC20(_tokenIn).safeTransfer(vault, _amountIn);
        IGmxVault(vault).swap(
            _tokenIn,
            _tokenOut,
            address(this) // No check for amount-out within swap function
        );
        // Confidently transfer amount-out
        _returnTo(_tokenOut, _amountOut, _to);
    }

    function setAllowances() public override onlyOwner {}
}
