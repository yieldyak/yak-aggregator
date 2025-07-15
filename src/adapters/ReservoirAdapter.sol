// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { YakAdapter, IERC20, SafeERC20 } from "../YakAdapter.sol";
import { IGenericFactory } from "../interface/IGenericFactory.sol";
import { IQuoter } from "../interface/IReservoirQuoter.sol";
import { IReservoirPair } from "../interface/IReservoirPair.sol";

contract ReservoirAdapter is YakAdapter {
    using SafeERC20 for IERC20;

    uint256 internal constant FEE_ACCURACY = 1_000_000;

    IGenericFactory public immutable factory;
    IQuoter public immutable quoter;

    constructor(
        string memory _name,
        address _factory,
        address _quoter,
        uint256 _swapGasEstimate // we use the worse off i.e. the stable pair gas estimate
    ) YakAdapter(_name, _swapGasEstimate) {
        factory = IGenericFactory(_factory);
        quoter = IQuoter(_quoter);
    }

    function _queryWithCurveId(
        uint256 _amountIn,
        address _tokenIn,
        address _tokenOut
    ) internal view returns (uint256 amountOut, uint256 curveId) {
        if (_tokenIn == _tokenOut || _amountIn == 0) {
            return (0, 0);
        }

        address[] memory path = new address[](2);
        path[0] = _tokenIn;
        path[1] = _tokenOut;
        uint256[] memory curveIds = new uint256[](1);
        curveIds[0] = 0;

        uint256 constantProductAmtOut;
        // try get quote for constant product pair
        try quoter.getAmountsOut(_amountIn, path, curveIds) returns (uint256[] memory amtsOut) {
            constantProductAmtOut = amtsOut[1];
        } catch {}

        curveIds[0] = 1;
        uint256 stableAmtOut;
        // try get quote for stable pair
        try quoter.getAmountsOut(_amountIn, path, curveIds) returns (uint256[] memory amtsOut) {
            stableAmtOut = amtsOut[1];
        } catch {}

        return stableAmtOut > constantProductAmtOut ? (stableAmtOut, 1) : (constantProductAmtOut, 0);
    }

    function _query(
        uint256 _amountIn,
        address _tokenIn,
        address _tokenOut
    ) internal view override returns (uint256 amountOut) {
        (amountOut, ) = _queryWithCurveId(_amountIn, _tokenIn, _tokenOut);
    }

    function _swap(
        uint256 _amountIn,
        uint256 _amountOut,
        address _tokenIn,
        address _tokenOut,
        address to
    ) internal override {
        (uint256 amountOut, uint256 curveId) = _queryWithCurveId(_amountIn, _tokenIn, _tokenOut);
        require(amountOut >= _amountOut, "ResAdap: Insufficient amount out");

        address pair = factory.getPair(_tokenIn, _tokenOut, curveId);
        address token0 = IReservoirPair(pair).token0();

        IERC20(_tokenIn).safeTransfer(pair, _amountIn);
        IReservoirPair(pair).swap(
            _tokenIn == token0 ? int256(_amountIn) : -int256(_amountIn),
            true,
            to,
            new bytes(0)
        );
    }
}
