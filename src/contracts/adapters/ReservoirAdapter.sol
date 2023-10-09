// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "../YakAdapter.sol";
import "../interface/IGenericFactory.sol";

contract ReservoirAdapter is YakAdapter {

    uint256 internal constant FEE_ACCURACY = 1_000_000;

    IGenericFactory public immutable factory;

    constructor(
        string memory _name,
        address _factory,
        uint256 _swapGasEstimate
    ) YakAdapter(_name, _swapGasEstimate) {
        factory = IGenericFactory(_factory);
    }

    function _query(
        uint256 _amountIn,
        address _tokenIn,
        address _tokenOut
    ) internal view override returns (uint256 amountOut) {
        if (_tokenIn == _tokenOut || _amountIn == 0) {
            return 0;
        }
        address cpPair = factory.getPair(_tokenIn, _tokenOut, 0);
        address stablePair = factory.getPair(_tokenIn, _tokenOut, 1);

        if (cpPair == address(0)) { }
        if (stablePair == address(0)) { }


    }

    function _swap(
        uint256 _amountIn,
        uint256 _amountOut,
        address _tokenIn,
        address _tokenOut,
        address to
    ) internal override {

    }
}
