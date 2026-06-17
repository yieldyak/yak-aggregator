// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import "./IYakRouter.sol";

interface ISimpleRouter {
    error UnsupportedSwap(address _tokenIn, address _tokenOut);
    error SlippageExceeded();
    error InvalidConfiguration();
    error FeeExceedsMaximum(uint256 _feeBips, uint256 _maxFeeBips);
    error InvalidFeeCollector(address _feeCollector);
    error AdapterNotAllowed(address _adapter);
    error UnauthorizedRole(bytes32 _role, address _account);

    event UpdateFeeBips(uint256 _oldFeeBips, uint256 _newFeeBips);
    event UpdateFeeCollector(address _oldFeeCollector, address _newFeeCollector);
    event UpdateAllowedAdapter(address indexed _adapter, bool _allowed);

    struct SwapConfig {
        bool useYakSwapRouter;
        uint8 yakSwapMaxSteps;
        Path path;
    }

    struct Path {
        address[] adapters;
        address[] tokens;
    }

    function query(uint256 _amountIn, address _tokenIn, address _tokenOut)
        external
        view
        returns (FormattedOffer memory offer);

    function swap(FormattedOffer memory _trade) external returns (uint256 amountOut);

    function swap(uint256 _amountIn, uint256 _amountOutMin, address _tokenIn, address _tokenOut)
        external
        returns (uint256 amountOut);
}
