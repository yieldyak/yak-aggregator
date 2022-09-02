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

import "../interface/IGmxVault.sol";
import "../interface/IERC20.sol";
import "../lib/SafeERC20.sol";
import "../YakAdapter.sol";

contract GmxAdapter is YakAdapter {
    using SafeERC20 for IERC20;

    uint256 public constant BASIS_POINTS_DIVISOR = 1e4;
    uint256 public constant PRICE_PRECISION = 1e30;
    uint256 public constant USDG_DECIMALS = 18;
    address public immutable VAULT;
    bool immutable USE_VAULT_UTILS;
    address immutable USDG;
    mapping(address => bool) public isPoolTkn; // unwanted tkns can be ignored by adapter
    mapping(address => uint256) tokenDecimals;

    constructor(
        string memory _name,
        address _vault,
        uint256 _swapGasEstimate
    ) YakAdapter(_name, _swapGasEstimate) {
        _setVaultTkns(_vault);
        USE_VAULT_UTILS = _vaultHasUtils(_vault);
        USDG = IGmxVault(_vault).usdg();
        VAULT = _vault;
    }

    //                                 UTILS                                  \\

    function addPoolTkns(address[] calldata _tokens) external onlyMaintainer {
        for (uint256 i; i < _tokens.length; ++i) _setToken(_tokens[i]);
    }

    function rmPoolTkns(address[] calldata _tokens) external onlyMaintainer {
        for (uint256 i; i < _tokens.length; ++i) isPoolTkn[_tokens[i]] = false;
    }

    function _setVaultTkns(address _vault) internal {
        uint256 whitelistedTknsLen = IGmxVault(_vault).allWhitelistedTokensLength();
        for (uint256 i = 0; i < whitelistedTknsLen; i++) {
            address token = IGmxVault(_vault).allWhitelistedTokens(i);
            _setToken(token);
        }
    }

    function _setToken(address _token) internal {
        tokenDecimals[_token] = IERC20(_token).decimals();
        isPoolTkn[_token] = true;
    }

    function _vaultHasUtils(address _vault) internal view returns (bool) {
        try IGmxVault(_vault).vaultUtils() {
            return true;
        } catch {
            return false;
        }
    }

    //                                 QUERY                                  \\

    function _query(
        uint256 _amountIn,
        address _tokenIn,
        address _tokenOut
    ) internal view override returns (uint256) {
        if (_validArgs(_amountIn, _tokenIn, _tokenOut)) return _getAmountOut(_amountIn, _tokenIn, _tokenOut);
    }

    function _validArgs(
        uint256 _amountIn,
        address _tokenIn,
        address _tokenOut
    ) internal view returns (bool) {
        return
            _amountIn != 0 &&
            _tokenIn != _tokenOut &&
            isPoolTkn[_tokenIn] &&
            IGmxVault(VAULT).whitelistedTokens(_tokenIn) &&
            IGmxVault(VAULT).whitelistedTokens(_tokenOut) &&
            IGmxVault(VAULT).isSwapEnabled() &&
            _hasVaultEnoughBal(_tokenIn, 1); // Prevents calc problems
    }

    function _getAmountOut(
        uint256 _amountIn,
        address _tokenIn,
        address _tokenOut
    ) internal view returns (uint256) {
        (uint256 amountOut, uint256 usdgAmount) = _getGrossAmountOutAndUsdg(_amountIn, _tokenIn, _tokenOut);
        return _calcNetAmountOut(_tokenIn, _tokenOut, amountOut, usdgAmount);
    }

    function _calcNetAmountOut(
        address _tokenIn,
        address _tokenOut,
        uint256 _amountOut,
        uint256 _usdgAmount
    ) internal view returns (uint256) {
        uint256 feeBps = _getFeeBasisPoint(_tokenIn, _tokenOut, _usdgAmount);
        uint256 netAmountOut = _amountOutAfterFees(_amountOut, feeBps);
        bool withinVaultLimits = _isWithinVaultLimits(_tokenIn, _tokenOut, _usdgAmount, netAmountOut);
        if (withinVaultLimits) return netAmountOut;
    }

    function _getGrossAmountOutAndUsdg(
        uint256 _amountIn,
        address _tokenIn,
        address _tokenOut
    ) internal view returns (uint256 amountOut, uint256 usdgAmount) {
        (uint256 priceIn, uint256 priceOut) = _getPrices(_tokenIn, _tokenOut);
        amountOut = (_amountIn * priceIn) / priceOut;
        amountOut = _adjustForDecimals(amountOut, _tokenIn, _tokenOut);
        usdgAmount = _getUsdgAmount(_amountIn, priceIn, _tokenIn);
    }

    function _getUsdgAmount(
        uint256 _amountIn,
        uint256 _priceIn,
        address _tokenIn
    ) internal view returns (uint256 usdgAmount) {
        usdgAmount = (_amountIn * _priceIn) / PRICE_PRECISION;
        usdgAmount = _adjustForDecimals(usdgAmount, _tokenIn, USDG);
    }

    function _amountOutAfterFees(uint256 _amountOut, uint256 _feeBasisPoints) internal pure returns (uint256) {
        return (_amountOut * (BASIS_POINTS_DIVISOR - _feeBasisPoints)) / BASIS_POINTS_DIVISOR;
    }

    function _adjustForDecimals(
        uint256 _amount,
        address _tokenDiv,
        address _tokenMul
    ) internal view returns (uint256) {
        uint256 decimalsDiv = _tokenDiv == USDG ? USDG_DECIMALS : tokenDecimals[_tokenDiv];
        uint256 decimalsMul = _tokenMul == USDG ? USDG_DECIMALS : tokenDecimals[_tokenMul];
        return (_amount * 10**decimalsMul) / 10**decimalsDiv;
    }

    function _getPrices(address _tokenIn, address _tokenOut) internal view returns (uint256 priceIn, uint256 priceOut) {
        IGmxVaultPriceFeed priceFeed = IGmxVault(VAULT).priceFeed();
        priceIn = priceFeed.getPrice(_tokenIn, false, true, true);
        priceOut = priceFeed.getPrice(_tokenOut, true, true, true);
    }

    function _hasVaultEnoughBal(address _token, uint256 _amount) private view returns (bool) {
        return IERC20(_token).balanceOf(VAULT) >= _amount;
    }

    function _isWithinVaultLimits(
        address _tokenIn,
        address _tokenOut,
        uint256 _amountInUsdg,
        uint256 _amountOut
    ) private view returns (bool) {
        uint256 poolBalTknOut = IGmxVault(VAULT).poolAmounts(_tokenOut);
        if (poolBalTknOut < _amountOut) return false;
        uint256 newPoolBalTknOut = poolBalTknOut - _amountOut;
        return
            !reservedAmountExceeded(newPoolBalTknOut, _tokenOut) &&
            !bufferAmountExceeded(newPoolBalTknOut, _tokenOut) &&
            !maxDebtExceeded(_amountInUsdg, _tokenIn);
    }

    function reservedAmountExceeded(uint256 _newPoolBalTknOut, address _tokenOut) internal view returns (bool) {
        uint256 reservedAmount = IGmxVault(VAULT).reservedAmounts(_tokenOut);
        return _newPoolBalTknOut < reservedAmount;
    }

    function bufferAmountExceeded(uint256 _newPoolBalTknOut, address _tokenOut) internal view returns (bool) {
        uint256 bufferAmount = IGmxVault(VAULT).bufferAmounts(_tokenOut);
        return _newPoolBalTknOut < bufferAmount;
    }

    function maxDebtExceeded(uint256 _amountInUsdg, address _tokenIn) internal view returns (bool) {
        uint256 maxUsdgAmount = IGmxVault(VAULT).maxUsdgAmounts(_tokenIn);
        if (maxUsdgAmount == 0) return false;
        uint256 newUsdgAmount = IGmxVault(VAULT).usdgAmounts(_tokenIn) + _amountInUsdg;
        return newUsdgAmount > maxUsdgAmount;
    }

    function _getFeeBasisPoint(
        address _tokenIn,
        address _tokenOut,
        uint256 usdgAmount
    ) internal view returns (uint256) {
        if (USE_VAULT_UTILS)
            return IGmxVault(VAULT).vaultUtils().getSwapFeeBasisPoints(_tokenIn, _tokenOut, usdgAmount);
        return _calcFeeBasisPoints(_tokenIn, _tokenOut, usdgAmount);
    }

    function _calcFeeBasisPoints(
        address _tokenIn,
        address _tokenOut,
        uint256 usdgAmount
    ) internal view returns (uint256 feeBasisPoints) {
        bool isStableSwap = IGmxVault(VAULT).stableTokens(_tokenIn) && IGmxVault(VAULT).stableTokens(_tokenOut);
        uint256 baseBps = isStableSwap
            ? IGmxVault(VAULT).stableSwapFeeBasisPoints()
            : IGmxVault(VAULT).swapFeeBasisPoints();
        uint256 taxBps = isStableSwap ? IGmxVault(VAULT).stableTaxBasisPoints() : IGmxVault(VAULT).taxBasisPoints();
        uint256 feesBasisPoints0 = IGmxVault(VAULT).getFeeBasisPoints(_tokenIn, usdgAmount, baseBps, taxBps, true);
        uint256 feesBasisPoints1 = IGmxVault(VAULT).getFeeBasisPoints(_tokenOut, usdgAmount, baseBps, taxBps, false);
        // use the higher of the two fee basis points
        feeBasisPoints = feesBasisPoints0 > feesBasisPoints1 ? feesBasisPoints0 : feesBasisPoints1;
    }

    //                                  SWAP                                  \\

    function _swap(
        uint256 _amountIn,
        uint256 _amountOut,
        address _tokenIn,
        address _tokenOut,
        address _to
    ) internal override {
        IERC20(_tokenIn).safeTransfer(VAULT, _amountIn);
        IGmxVault(VAULT).swap(
            _tokenIn,
            _tokenOut,
            address(this) // No check for amount-out within swap function
        );
        // Confidently transfer amount-out
        _returnTo(_tokenOut, _amountOut, _to);
    }
}
