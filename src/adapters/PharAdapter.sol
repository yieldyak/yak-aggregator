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
    function tickSpacingInitialFee(int24) external view returns (int24);

    function getPool(address, address, int24) external view returns (address);
}

contract PharAdapter is UniswapV3likeAdapter {
    using SafeERC20 for IERC20;

    address immutable FACTORY;
    mapping(int24 => bool) public isTickSpacingEnabled;
    int24[] public tickSpacings;

    constructor(
        string memory _name,
        uint256 _swapGasEstimate,
        uint256 _quoterGasLimit,
        address _quoter,
        address _factory,
        int24[] memory _defaultTickSpacings
    ) UniswapV3likeAdapter(_name, _swapGasEstimate, _quoter, _quoterGasLimit) {
        FACTORY = _factory;
        for (uint256 i = 0; i < _defaultTickSpacings.length; i++) {
            addTickSpacing(_defaultTickSpacings[i]);
        }
    }

    function enableTickSpacings(int24[] calldata _tickSpacings) external onlyMaintainer {
        for (uint256 i; i < _tickSpacings.length; ++i) {
            enableTickSpacing(_tickSpacings[i]);
        }
    }

    function enableTickSpacing(int24 _tickSpacing) internal {
        require(!isTickSpacingEnabled[_tickSpacing], "Tick spacing already enabled");
        if (IUniV3Factory(FACTORY).tickSpacingInitialFee(_tickSpacing) == 0) {
            revert("Factory doesn't support tick spacing");
        }
        addTickSpacing(_tickSpacing);
    }

    function addTickSpacing(int24 _tickSpacing) internal {
        isTickSpacingEnabled[_tickSpacing] = true;
        tickSpacings.push(_tickSpacing);
    }

    function getBestPool(address token0, address token1) internal view override returns (address mostLiquid) {
        uint128 deepestLiquidity;
        for (uint256 i; i < tickSpacings.length; ++i) {
            address pool = IUniV3Factory(FACTORY).getPool(token0, token1, tickSpacings[i]);
            if (pool == address(0)) {
                continue;
            }
            uint128 liquidity = IUniV3Pool(pool).liquidity();
            if (liquidity > deepestLiquidity) {
                deepestLiquidity = liquidity;
                mostLiquid = pool;
            }
        }
    }

    function uniswapV3SwapCallback(int256 amount0Delta, int256 amount1Delta, bytes calldata) external {
        if (amount0Delta > 0) {
            IERC20(IUniV3Pool(msg.sender).token0()).transfer(msg.sender, uint256(amount0Delta));
        } else {
            IERC20(IUniV3Pool(msg.sender).token1()).transfer(msg.sender, uint256(amount1Delta));
        }
    }
}
