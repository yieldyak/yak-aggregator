// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { YakAdapter } from "../YakAdapter.sol";
import "../interface/IGenericFactory.sol";
import { IQuoter } from "../interface/IReservoirQuoter.sol";

contract ReservoirAdapter is YakAdapter {

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

    function _query(
        uint256 _amountIn,
        address _tokenIn,
        address _tokenOut
    ) internal view override returns (uint256 amountOut) {
        if (_tokenIn == _tokenOut || _amountIn == 0) {
            return 0;
        }

        uint256 constantProductAmtOut;
        // try get quote for constant product pair
        try quoter.getAmountsOut(_amountIn, [_tokenIn, _tokenOut], [0]) returns (uint256[] amtsOut) {
            constantProductAmtOut = amtsOut[0];
        } catch {}

        uint256 stableAmtOut;
        // try get quote for stable pair
        try quoter.getAmountsOut(_amountIn, [_tokenIn, _tokenOut], [1]) returns (uint256[] amtsOut) {
        } catch {}

        return stableAmtOut > constantProductAmtOut ? stableAmtOut : constantProductAmtOut;
    }

    function _swap(
        uint256 _amountIn,
        uint256 _amountOut,
        address _tokenIn,
        address _tokenOut,
        address to
    ) internal override {

        // case 1: if there is a pair for a curveId but not for the other curveId

        // case 2: if are pairs for both curveIds
    }
}
