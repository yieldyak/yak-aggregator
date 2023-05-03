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

import "../interface/IERC20.sol";
import "../lib/SafeERC20.sol";
import "../YakAdapter.sol";

interface IFactory {
    function getPool(address, address) external view returns (address);
}

interface IPair {
    function getAmountOut(address, uint, address) external view returns (uint256);

    function swap(
        bytes calldata data,
        address sender,
        address callback,
        bytes calldata callbackData
    ) external returns (address token, uint amount);
}

interface IVault {
    function deposit(address token, address to) external returns (uint amount);
}

contract SyncSwapAdapter is YakAdapter {
    using SafeERC20 for IERC20;

    uint8 constant WITHDRAW_MODE = 2; // receive WETH

    address immutable FACTORY;
    address immutable STABLE_FACTORY;
    address immutable VAULT;

    constructor(
        string memory _name,
        address _factory,
        address _stableFactory,
        address _vault,
        uint256 _swapGasEstimate
    ) YakAdapter(_name, _swapGasEstimate) {
        FACTORY = _factory;
        STABLE_FACTORY = _stableFactory;
        VAULT = _vault;
    }

    function _getQuoteAndPair(
        uint256 _amountIn,
        address _tokenIn,
        address _tokenOut
    ) internal view returns (uint256 amountOut, address pair) {
        pair = IFactory(FACTORY).getPool(_tokenIn, _tokenOut);
        if (pair > address(0)) amountOut = IPair(pair).getAmountOut(_tokenIn, _amountIn, address(this));

        address stablePair = IFactory(STABLE_FACTORY).getPool(_tokenIn, _tokenOut);
        if (stablePair > address(0)) {
            uint256 amountOutStable = IPair(stablePair).getAmountOut(_tokenIn, _amountIn, address(this));
            if (amountOutStable > amountOut) {
                amountOut = amountOutStable;
                pair = stablePair;
            }
        }
    }

    function _query(
        uint256 _amountIn,
        address _tokenIn,
        address _tokenOut
    ) internal view override returns (uint256 amountOut) {
        if (_tokenIn != _tokenOut && _amountIn != 0) (amountOut, ) = _getQuoteAndPair(_amountIn, _tokenIn, _tokenOut);
    }

    function _swap(
        uint256 _amountIn,
        uint256 _amountOut,
        address _tokenIn,
        address _tokenOut,
        address _to
    ) internal override {
        (uint256 amountOut, address pair) = _getQuoteAndPair(_amountIn, _tokenIn, _tokenOut);
        require(amountOut >= _amountOut, "Insufficent amount out");
        IERC20(_tokenIn).safeTransfer(VAULT, _amountIn);
        IVault(VAULT).deposit(_tokenIn, pair);
        bytes memory data = abi.encode(_tokenIn, _to, WITHDRAW_MODE);
        IPair(pair).swap(data, address(this), address(0), "");
    }
}
