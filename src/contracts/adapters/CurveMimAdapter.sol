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

contract CurveMimAdapter is YakAdapter {
    using SafeERC20 for IERC20;

    address public constant basePool = 0x7f90122BF0700F9E7e1F688fe926940E8839F353;
    address public constant swapper = 0x001E3BA199B4FF4B5B6e97aCD96daFC0E2e4156e;
    address public constant pool = 0x30dF229cefa463e991e29D42DB0bae2e122B2AC7;
    mapping(address => int128) public tokenIndex;
    mapping(address => bool) public isPoolToken;

    constructor(string memory _name, uint256 _swapGasEstimate) YakAdapter(_name, _swapGasEstimate) {
        _setPoolTokens();
    }

    // Mapping indicator which tokens are included in the pool
    function _setPoolTokens() internal {
        address metaTkn = ICurveMim(pool).coins(0);
        _setPoolTokenAllowance(metaTkn);
        isPoolToken[metaTkn] = true;
        tokenIndex[metaTkn] = 0;
        for (uint256 i = 0; true; i++) {
            try ICurveMim(basePool).underlying_coins(i) returns (address token) {
                _setPoolTokenAllowance(token);
                isPoolToken[token] = true;
                tokenIndex[token] = int128(int256(i)) + 1;
            } catch {
                break;
            }
        }
    }

    function _setPoolTokenAllowance(address _token) internal {
        IERC20(_token).approve(swapper, UINT_MAX);
    }

    function _query(
        uint256 _amountIn,
        address _tokenIn,
        address _tokenOut
    ) internal view override returns (uint256) {
        if (_amountIn == 0 || _tokenIn == _tokenOut || !isPoolToken[_tokenIn] || !isPoolToken[_tokenOut]) {
            return 0;
        }
        try ICurveMim(pool).get_dy_underlying(tokenIndex[_tokenIn], tokenIndex[_tokenOut], _amountIn) returns (
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
        ICurveMim(swapper).exchange_underlying(
            pool,
            tokenIndex[_tokenIn],
            tokenIndex[_tokenOut],
            _amountIn,
            _amountOut
        );
        // Confidently transfer amount-out
        _returnTo(_tokenOut, _amountOut, _to);
    }
}
