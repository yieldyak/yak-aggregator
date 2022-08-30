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

// Supports Curve MIM pool (manually enter base tokens)

// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.0;

import "../interface/ICurveMim.sol";
import "../interface/IERC20.sol";
import "../lib/SafeERC20.sol";

import "../YakAdapter.sol";

contract CurveMoreAdapter is YakAdapter {
    using SafeERC20 for IERC20;

    address public constant MONEY_USD = 0x0f577433Bf59560Ef2a79c124E9Ff99fCa258948;
    address public constant BASE_POOL = 0x7f90122BF0700F9E7e1F688fe926940E8839F353;
    address public constant SWAPPER = 0x001E3BA199B4FF4B5B6e97aCD96daFC0E2e4156e;
    address public constant POOL = 0xb3F21Fc59Bc06209D5fb82c474F21582AEf09a20;
    bytes32 public constant id = keccak256("CurveMoreAdapter");
    mapping(address => int128) public tokenIndex;
    mapping(address => bool) public isUnderlyingToken;

    constructor(string memory _name, uint256 _swapGasEstimate) {
        name = _name;
        _setPoolTokens();
        setSwapGasEstimate(_swapGasEstimate);
    }

    function _setPoolTokens() internal {
        // MONEY_USD index is set to 0 by default
        for (uint256 i = 0; true; i++) {
            try ICurveMim(BASE_POOL).underlying_coins(i) returns (address token) {
                isUnderlyingToken[token] = true;
                tokenIndex[token] = int128(int256(i)) + 1;
            } catch {
                break;
            }
        }
    }

    function setAllowances() public override onlyOwner {}

    function _approveIfNeeded(address _tokenIn, uint256 _amount) internal override {
        uint256 allowance = IERC20(_tokenIn).allowance(address(this), SWAPPER);
        if (allowance < _amount) {
            IERC20(_tokenIn).safeApprove(SWAPPER, UINT_MAX);
        }
    }

    function _query(
        uint256 _amountIn,
        address _tokenIn,
        address _tokenOut
    ) internal view override returns (uint256) {
        if (
            _amountIn == 0 ||
            _tokenIn == _tokenOut ||
            !((_tokenOut == MONEY_USD && isUnderlyingToken[_tokenIn]) ||
                (_tokenIn == MONEY_USD && isUnderlyingToken[_tokenOut]))
        ) {
            return 0;
        }
        try ICurveMim(POOL).get_dy_underlying(tokenIndex[_tokenIn], tokenIndex[_tokenOut], _amountIn) returns (
            uint256 amountOut
        ) {
            // `calc_token_amount` in base_pool is used in part of the query
            // this method does account for deposit fee which causes discrepancy
            // between the query result and the actual swap amount by few bps(0-3.2)
            // Additionally there is a rounding error (swap and query may calc different amounts)
            // Account for that with 4 bps discount
            return amountOut == 0 ? 0 : (amountOut * (1e4 - 4)) / 1e4;
        } catch {
            return 0;
        }
    }

    function _swap(
        uint256 _amountIn,
        uint256 _amountOut,
        address _tokenIn,
        address _tokenOut,
        address _to
    ) internal override {
        ICurveMim(SWAPPER).exchange_underlying(
            POOL,
            tokenIndex[_tokenIn],
            tokenIndex[_tokenOut],
            _amountIn,
            _amountOut
        );
        // Curve-pool reverts if dy is not met
        // Dont leave funds in the adapter that are there due to query imprecision
        _returnTo(_tokenOut, IERC20(_tokenOut).balanceOf(address(this)), _to);
    }
}
