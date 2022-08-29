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

import "../interface/IWooPP.sol";
import "../interface/IERC20.sol";
import "../lib/SafeERC20.sol";
import "../YakAdapter.sol";

contract WoofiAdapter is YakAdapter {
    using SafeERC20 for IERC20;

    bytes32 public constant id = keccak256("WoofiAdapter");
    address public immutable quoteToken;
    address public rebateCollector;
    address public immutable pool;

    constructor(
        string memory _name,
        uint256 _swapGasEstimate,
        address _pool
    ) {
        setSwapGasEstimate(_swapGasEstimate);
        quoteToken = IWooPP(_pool).quoteToken();
        pool = _pool;
        name = _name;
    }

    function setRebateCollector(address _rebateCollector) external onlyOwner {
        rebateCollector = _rebateCollector;
    }

    function _approveIfNeeded(address _tokenIn, uint256 _amount)
        internal
        override
    {
        uint256 allowance = IERC20(_tokenIn).allowance(address(this), pool);
        if (allowance < _amount) {
            IERC20(_tokenIn).safeApprove(pool, UINT_MAX);
        }
    }

    function _safeQuery(
        function(address, uint256) external view returns (uint256) qFn,
        address _baseToken,
        uint256 _baseAmount
    ) internal view returns (uint256) {
        try qFn(_baseToken, _baseAmount) returns (uint256 amountOut) {
            return amountOut;
        } catch {
            return 0;
        }
    }

    function _query(
        uint256 _amountIn,
        address _tokenIn,
        address _tokenOut
    ) internal view override returns (uint256 amountOut) {
        if (_amountIn == 0) {
            return 0;
        }
        if (_tokenIn == quoteToken) {
            amountOut = _safeQuery(
                IWooPP(pool).querySellQuote,
                _tokenOut,
                _amountIn
            );
        } else if (_tokenOut == quoteToken) {
            amountOut = _safeQuery(
                IWooPP(pool).querySellBase,
                _tokenIn,
                _amountIn
            );
        } else {
            uint256 quoteAmount = _safeQuery(
                IWooPP(pool).querySellBase,
                _tokenIn,
                _amountIn
            );
            amountOut = _safeQuery(
                IWooPP(pool).querySellQuote,
                _tokenOut,
                quoteAmount
            );
        }
    }

    function _swap(
        uint256 _amountIn,
        uint256 _amountOut,
        address _tokenIn,
        address _tokenOut,
        address _to
    ) internal override {
        uint256 realToAmount;
        if (_tokenIn == quoteToken) {
            realToAmount = IWooPP(pool).sellQuote(
                _tokenOut,
                _amountIn,
                _amountOut,
                _to,
                rebateCollector
            );
        } else if (_tokenOut == quoteToken) {
            realToAmount = IWooPP(pool).sellBase(
                _tokenIn,
                _amountIn,
                _amountOut,
                _to,
                rebateCollector
            );
        } else {
            uint256 quoteAmount = IWooPP(pool).sellBase(
                _tokenIn,
                _amountIn,
                0,
                address(this),
                rebateCollector
            );
            _approveIfNeeded(quoteToken, quoteAmount);
            realToAmount = IWooPP(pool).sellQuote(
                _tokenOut,
                quoteAmount,
                _amountOut,
                _to,
                rebateCollector
            );
        }
    }

    function setAllowances() public override onlyOwner {}
}
