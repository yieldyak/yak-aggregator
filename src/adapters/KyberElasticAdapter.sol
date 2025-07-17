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

interface IKyberPool {
    function token0() external view returns (address);

    function token1() external view returns (address);

    function swap(
        address recipient,
        int256 swapQty,
        bool isToken0,
        uint160 limitSqrtP,
        bytes calldata data
    ) external returns (int256 qty0, int256 qty1);
}

contract KyberElasticAdapter is UniswapV3likeAdapter {
    using SafeERC20 for IERC20;

    mapping(address => mapping(address => address)) public tknsToPoolWL;

    constructor(
        string memory _name,
        uint256 _swapGasEstimate,
        uint256 _quoterGasLimit,
        address _quoter,
        address[] memory _whitelistedPools
    ) UniswapV3likeAdapter(_name, _swapGasEstimate, _quoter, _quoterGasLimit) {
        addPoolsToWL(_whitelistedPools);
    }

    function addPoolsToWL(address[] memory pools) public onlyMaintainer {
        for (uint256 i; i < pools.length; ++i) addPoolToWL(pools[i]);
    }

    function rmPoolsFromWL(address[] memory pools) external onlyMaintainer {
        for (uint256 i; i < pools.length; ++i) rmPoolFromWL(pools[i]);
    }

    function addPoolToWL(address pool) internal {
        address t0 = IKyberPool(pool).token0();
        address t1 = IKyberPool(pool).token1();
        tknsToPoolWL[t0][t1] = pool;
        tknsToPoolWL[t1][t0] = pool;
    }

    function rmPoolFromWL(address pool) internal {
        address t0 = IKyberPool(pool).token0();
        address t1 = IKyberPool(pool).token1();
        tknsToPoolWL[t0][t1] = address(0);
        tknsToPoolWL[t1][t0] = address(0);
    }

    function _underlyingSwap(
        QParams memory params, 
        bytes memory callbackData
    ) internal override returns (uint256) {
        address pool = getBestPool(params.tokenIn, params.tokenOut);
        (bool zeroForOne, uint160 sqrtPriceLimitX96) = 
            getZeroOneAndSqrtPriceLimitX96(params.tokenIn, params.tokenOut);
        (int256 amount0, int256 amount1) = IKyberPool(pool).swap(
            address(this),
            int256(params.amountIn),
            zeroForOne,
            sqrtPriceLimitX96,
            callbackData
        );
        return zeroForOne ? uint256(-amount1) : uint256(-amount0);
    }

    function getBestPool(
        address token0, 
        address token1
    ) internal view override returns (address) {
        return tknsToPoolWL[token0][token1];
    }

    function swapCallback(
        int256 amount0Delta,
        int256 amount1Delta,
        bytes calldata
    ) external {
        if (amount0Delta > 0) {
            IERC20(IKyberPool(msg.sender).token0()).transfer(msg.sender, uint256(amount0Delta));
        } else {
            IERC20(IKyberPool(msg.sender).token1()).transfer(msg.sender, uint256(amount1Delta));
        }
    }
}
