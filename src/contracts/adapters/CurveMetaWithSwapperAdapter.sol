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

import "../interface/ICurveMeta.sol";
import "../interface/ICurve2.sol";
import "../interface/IERC20.sol";
import "../lib/SafeERC20.sol";
import "../YakAdapter.sol";

interface ICurveSwapper128 {
    function exchange_underlying(
        address pool,
        int128 i,
        int128 j,
        uint256 dx,
        uint256 minDy
    ) external;
}

contract CurveMetaWithSwapperAdapter is YakAdapter {
    using SafeERC20 for IERC20;

    address public immutable swapper;
    address[] public metaPools;

    // These map from the metapool address to its data; this is preferable to using
    // structs to represent the metapool data, as mappings within structs are limited.
    mapping(address => address) public basePools;
    mapping(address => address) public metaTkns;
    mapping(address => mapping(address => int128)) public tokenIndices;
    mapping(address => mapping(address => bool)) public isPoolToken;

    constructor(
        string memory _name,
        uint256 _swapGasEstimate,
        address[] memory _metaPools,
        address[] memory _basePools,
        address _swapper
    ) YakAdapter(_name, _swapGasEstimate) {
        swapper = _swapper;
        require(_metaPools.length == _basePools.length, "mismatch between meta and base pools");

        for (uint8 i = 0; i < _metaPools.length; i++) {
            metaPools.push(_metaPools[i]);
            metaTkns[_metaPools[i]] = setMetaTkn(_metaPools[i], _swapper);
            _setUnderlyingTokens(_metaPools[i], _basePools[i], _swapper);
        }
    }

    // Mapping indicator which tokens are included in the pool
    function _setUnderlyingTokens(address _metaPool, address _basePool) internal {
        return _setUnderlyingTokens(_metaPool, _basePool, swapper);
    }

    // this function overload is to avoid reading the immutable swapper variable during contract creation
    function _setUnderlyingTokens(
        address _metaPool,
        address _basePool,
        address _swapper
    ) internal {
        for (uint256 i = 0; true; i++) {
            try ICurve2(_basePool).underlying_coins(i) returns (address token) {
                _setPoolTokenAllowance(token, _swapper);
                isPoolToken[_metaPool][token] = true;
                tokenIndices[_metaPool][token] = int128(int256(i)) + 1;
            } catch {
                break;
            }
        }
    }

    function setMetaTkn(address _metaPool) internal returns (address _metaTkn) {
        return setMetaTkn(_metaPool, swapper);
    }

    // this function overload is to avoid reading the immutable swapper variable during contract creation
    function setMetaTkn(address _metaPool, address _swapper) internal returns (address _metaTkn) {
        _metaTkn = ICurveMeta(_metaPool).coins(0);
        _setPoolTokenAllowance(_metaTkn, _swapper);
        isPoolToken[_metaPool][_metaTkn] = true;
        tokenIndices[_metaPool][_metaTkn] = 0;
    }

    function addPool(address _metaPool, address _basePool) public onlyMaintainer {
        metaPools.push(_metaPool);
        metaTkns[_metaPool] = setMetaTkn(_metaPool);
        _setUnderlyingTokens(_metaPool, _basePool);
    }

    function _setPoolTokenAllowance(address _token, address _target) internal {
        IERC20(_token).approve(_target, UINT_MAX);
    }

    // combination of tkn0 and tkn1 is not necessarily unique, so return all meta pools with that combination
    function _eligibleMetaPools(address _tkn0, address _tkn1) internal view returns (address[] memory) {
        uint8 numEligiblePools;

        for (uint8 i = 0; i < metaPools.length; i++) {
            if (isPoolToken[metaPools[i]][_tkn0] && isPoolToken[metaPools[i]][_tkn1]) {
                numEligiblePools++;
            }
        }

        address[] memory eligiblePools = new address[](numEligiblePools);
        uint8 currentEligiblePoolsIndex;
        for (uint8 i = 0; i < metaPools.length; i++) {
            if (isPoolToken[metaPools[i]][_tkn0] && isPoolToken[metaPools[i]][_tkn1]) {
                eligiblePools[currentEligiblePoolsIndex] = metaPools[i];
                currentEligiblePoolsIndex++;
            }
        }

        return eligiblePools;
    }

    function _queryPool(
        uint256 _amountIn,
        address _tokenIn,
        address _tokenOut,
        address _metaPool
    ) internal view returns (uint256) {
        if (!validInputParamsFromPool(_amountIn, _tokenIn, _tokenOut, _metaPool)) {
            return 0;
        }

        try
            ICurveMeta(_metaPool).get_dy_underlying(
                tokenIndices[_metaPool][_tokenIn],
                tokenIndices[_metaPool][_tokenOut],
                _amountIn
            )
        returns (uint256 amountOut) {
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

    function _queryMaxAmountOutFromPools(
        uint256 _amountIn,
        address _tokenIn,
        address _tokenOut,
        address[] memory _metaPools
    ) internal view returns (address maxAmountOutMetaPool, uint256 maxAmountOut) {
        uint256 currentMaxAmountOut = 0;
        address currentBestMetaPool;
        for (uint8 i = 0; i < _metaPools.length; i++) {
            uint256 amountOut = _queryPool(_amountIn, _tokenIn, _tokenOut, _metaPools[i]);
            if (amountOut > currentMaxAmountOut) {
                currentMaxAmountOut = amountOut;
                currentBestMetaPool = _metaPools[i];
            }
        }

        return (currentBestMetaPool, currentMaxAmountOut);
    }

    function _query(
        uint256 _amountIn,
        address _tokenIn,
        address _tokenOut
    ) internal view override returns (uint256) {
        address[] memory eligibleMetaPools = _eligibleMetaPools(_tokenIn, _tokenOut);
        if (!validInputParamsFromPools(_amountIn, _tokenIn, _tokenOut, eligibleMetaPools)) {
            return 0;
        }
        (, uint256 amountOut) = _queryMaxAmountOutFromPools(_amountIn, _tokenIn, _tokenOut, eligibleMetaPools);
        return amountOut;
    }

    function _swap(
        uint256 _amountIn,
        uint256 _amountOut,
        address _tokenIn,
        address _tokenOut,
        address _to
    ) internal override {
        address[] memory eligibleMetaPools = _eligibleMetaPools(_tokenIn, _tokenOut);
        (address bestMetaPool, ) = _queryMaxAmountOutFromPools(_amountIn, _tokenIn, _tokenOut, eligibleMetaPools);

        ICurveSwapper128(swapper).exchange_underlying(
            bestMetaPool,
            tokenIndices[bestMetaPool][_tokenIn],
            tokenIndices[bestMetaPool][_tokenOut],
            _amountIn,
            0
        );
        uint256 balThis = IERC20(_tokenOut).balanceOf(address(this));
        require(balThis >= _amountOut, "Insufficient amount-out");
        _returnTo(_tokenOut, balThis, _to);
    }

    // validity checks

    function validInputParamsFromPool(
        uint256 _amountIn,
        address _tokenIn,
        address _tokenOut,
        address _metaPool
    ) internal view returns (bool) {
        return _amountIn != 0 && _tokenIn != _tokenOut && validPathFromPool(_tokenIn, _tokenOut, _metaPool);
    }

    function validPathFromPool(
        address tkn0,
        address tkn1,
        address metaPool
    ) internal view returns (bool) {
        return
            (tkn0 == metaTkns[metaPool] && isPoolToken[metaPool][tkn1]) ||
            (tkn1 == metaTkns[metaPool] && isPoolToken[metaPool][tkn0]);
    }

    function validInputParamsFromPools(
        uint256 _amountIn,
        address _tokenIn,
        address _tokenOut,
        address[] memory _metaPools
    ) internal view returns (bool) {
        return _amountIn != 0 && _tokenIn != _tokenOut && validPathFromPools(_tokenIn, _tokenOut, _metaPools);
    }

    function validPathFromPools(
        address tkn0,
        address tkn1,
        address[] memory eligibleMetaPools
    ) internal view returns (bool) {
        for (uint8 i = 0; i < eligibleMetaPools.length; i++) {
            if (validPathFromPool(tkn0, tkn1, eligibleMetaPools[i])) {
                return true;
            }
        }
        return false;
    }
}
