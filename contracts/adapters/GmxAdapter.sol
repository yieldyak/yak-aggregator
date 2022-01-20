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
    using SafeMath for uint;

    bytes32 public constant id = keccak256("GmxAdapter");
    address public constant USDG = 0xc0253c3cC6aa5Ab407b5795a04c28fB063273894;
    uint public constant BASIS_POINTS_DIVISOR = 1e4;
    uint public constant PRICE_PRECISION = 1e30;
    uint public constant USDG_DECIMALS = 18;
    address public vault;
    mapping(address => uint) public tokenDecimals;
    mapping(address => bool) public isPoolToken;

    constructor(string memory _name, address _vault, uint _swapGasEstimate) {
        name = _name; 
        vault = _vault;
        setSwapGasEstimate(_swapGasEstimate);
        setPoolTokens();
    }

    function _approveIfNeeded(address _tokenIn, uint _amount) internal override {
        uint allowance = IERC20(_tokenIn).allowance(address(this), vault);
        if (allowance < _amount) {
            IERC20(_tokenIn).safeApprove(vault, UINT_MAX);
        }
    }

    function setPoolTokens() public {
        uint whitelistedTknsLen = IGmxVault(vault).allWhitelistedTokensLength();
        for (uint i = 0; i < whitelistedTknsLen; i++) {
            address token = IGmxVault(vault).allWhitelistedTokens(i);
            tokenDecimals[token] = IERC20(token).decimals();
            isPoolToken[token] = true;
        }
    }

    function adjustForDecimals(
        uint _amount, 
        address _tokenDiv, 
        address _tokenMul
    ) internal view returns (uint) {
        uint decimalsDiv = _tokenDiv == USDG ? USDG_DECIMALS : tokenDecimals[_tokenDiv];
        uint decimalsMul = _tokenMul == USDG ? USDG_DECIMALS : tokenDecimals[_tokenMul];
        return _amount.mul(10**decimalsMul) / 10**decimalsDiv;
    }

    function getPrices(
        address _tokenIn, 
        address _tokenOut
    ) internal view returns (uint priceIn, uint priceOut) {
        IGmxVaultPriceFeed priceFeed = IGmxVault(vault).priceFeed();
        priceIn = priceFeed.getPrice(_tokenIn, false, true, true);
        priceOut = priceFeed.getPrice(_tokenOut, true, true, true);
    }

    function _query(
        uint _amountIn, 
        address _tokenIn, 
        address _tokenOut
    ) internal override view returns (uint) {
        if (
            _amountIn==0 || 
            _tokenIn==_tokenOut ||
            !isPoolToken[_tokenIn] || 
            !isPoolToken[_tokenOut] ||
            !IGmxVault(vault).isSwapEnabled()
        ) { return 0; }

        ( uint priceIn, uint priceOut ) = getPrices(_tokenIn, _tokenOut);
        uint amountOut = _amountIn.mul(priceIn) / priceOut;

        amountOut = adjustForDecimals(
            amountOut, 
            _tokenIn, 
            _tokenOut
        );
        uint usdgAmount = _amountIn.mul(priceIn) / PRICE_PRECISION;
        usdgAmount = adjustForDecimals(
            usdgAmount, 
            _tokenIn, 
            USDG
        );
        uint feeBasisPoints = IGmxVault(vault).vaultUtils()
            .getSwapFeeBasisPoints(
                _tokenIn, 
                _tokenOut, 
                usdgAmount
            );
        uint amountOutAfterFees = amountOut
            .mul(BASIS_POINTS_DIVISOR.sub(feeBasisPoints))
            / BASIS_POINTS_DIVISOR;

        return amountOutAfterFees;
    }

    function _swap(
        uint _amountIn, 
        uint _amountOut, 
        address _tokenIn, 
        address _tokenOut, 
        address _to
    ) internal override {
        IERC20(_tokenIn).safeTransfer(vault, _amountIn);
        IGmxVault(vault).swap(
            _tokenIn,
            _tokenOut,
            address(this)  // No check for amount-out within swap function
        );
        // Confidently transfer amount-out
        _returnTo(_tokenOut, _amountOut, _to);
    }

    function setAllowances() public override onlyOwner {}

}