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

import "./UniswapV3likeAdapter.sol";

interface IUniV3Factory {
    function feeAmountTickSpacing(uint24) external view returns (int24);

    function getPool(
        address,
        address,
        uint24
    ) external view returns (address);
}

contract RamsesV2Adapter is UniswapV3likeAdapter {
    using SafeERC20 for IERC20;

    address immutable FACTORY;
    mapping(uint24 => bool) public isFeeAmountEnabled;
    uint24[] public feeAmounts;

    constructor(
        string memory _name,
        uint256 _swapGasEstimate,
        uint256 _quoterGasLimit,
        address _quoter,
        address _factory,
        uint24[] memory _defaultFees
    ) UniswapV3likeAdapter(_name, _swapGasEstimate, _quoter, _quoterGasLimit) {
        FACTORY = _factory;
        for (uint i = 0; i < _defaultFees.length; i++) {
            addFeeAmount(_defaultFees[i]);
        }
    }

    function enableFeeAmounts(uint24[] calldata _amounts) external onlyMaintainer {
        for (uint256 i; i < _amounts.length; ++i) enableFeeAmount(_amounts[i]);
    }

    function enableFeeAmount(uint24 _fee) internal {
        require(!isFeeAmountEnabled[_fee], "Fee already enabled");
        if (IUniV3Factory(FACTORY).feeAmountTickSpacing(_fee) == 0)
            revert("Factory doesn't support fee");
        addFeeAmount(_fee);
    }

    function addFeeAmount(uint24 _fee) internal {
        isFeeAmountEnabled[_fee] = true;
        feeAmounts.push(_fee);
    }

    function getBestPool(
        address token0, 
        address token1
    ) internal view override returns (address mostLiquid) {
        uint128 deepestLiquidity;
        for (uint256 i; i < feeAmounts.length; ++i) {
            address pool = IUniV3Factory(FACTORY).getPool(token0, token1, feeAmounts[i]);
            if (pool == address(0))
                continue;
            uint128 liquidity = IUniV3Pool(pool).liquidity();
            if (liquidity > deepestLiquidity) {
                deepestLiquidity = liquidity;
                mostLiquid = pool;
            }
        }
    }

    function ramsesV2SwapCallback(
        int256 amount0Delta,
        int256 amount1Delta,
        bytes calldata
    ) external {
        if (amount0Delta > 0) {
            IERC20(IUniV3Pool(msg.sender).token0()).transfer(msg.sender, uint256(amount0Delta));
        } else {
            IERC20(IUniV3Pool(msg.sender).token1()).transfer(msg.sender, uint256(amount1Delta));
        }
    }
}
