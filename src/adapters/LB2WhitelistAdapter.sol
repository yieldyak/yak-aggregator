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

import "../YakAdapter.sol";
import "../interface/IERC20.sol";
import "../lib/SafeERC20.sol";
import "../interface/ILB2Pair.sol";

contract LB2WhitelistAdapter is YakAdapter {
    using SafeERC20 for IERC20;

    event PairAdded(address indexed pair, address indexed tokenX, address indexed tokenY);
    event PairRemoved(address indexed pair, address indexed tokenX, address indexed tokenY);

    // Mapping: tokenA => tokenB => array of whitelisted pairs
    // Stored bidirectionally for O(1) lookup
    mapping(address => mapping(address => address[])) internal _pairsByTokens;

    // Track if a pair is whitelisted (for O(1) existence check)
    mapping(address => bool) public isWhitelisted;

    // All whitelisted pairs (for off-chain viewing)
    address[] internal _allPairs;

    uint256 public quoteGasLimit = 600_000;

    constructor(string memory _name, uint256 _swapGasEstimate, uint256 _quoteGasLimit, address[] memory _pairs)
        YakAdapter(_name, _swapGasEstimate)
    {
        setQuoteGasLimit(_quoteGasLimit);
        for (uint256 i; i < _pairs.length; ++i) {
            _addPair(_pairs[i]);
        }
    }

    function setQuoteGasLimit(uint256 _quoteGasLimit) public onlyMaintainer {
        quoteGasLimit = _quoteGasLimit;
    }

    function addWhitelistedPair(address _pair) external onlyMaintainer {
        require(!isWhitelisted[_pair], "Pair already whitelisted");
        _addPair(_pair);
    }

    function addWhitelistedPairs(address[] calldata _pairs) external onlyMaintainer {
        for (uint256 i; i < _pairs.length; ++i) {
            if (!isWhitelisted[_pairs[i]]) {
                _addPair(_pairs[i]);
            }
        }
    }

    function removeWhitelistedPair(address _pair) external onlyMaintainer {
        require(isWhitelisted[_pair], "Pair not whitelisted");

        address tokenX = ILBPair(_pair).getTokenX();
        address tokenY = ILBPair(_pair).getTokenY();

        _removePairFromArray(_pairsByTokens[tokenX][tokenY], _pair);
        _removePairFromArray(_pairsByTokens[tokenY][tokenX], _pair);
        _removePairFromArray(_allPairs, _pair);

        isWhitelisted[_pair] = false;

        emit PairRemoved(_pair, tokenX, tokenY);
    }

    function _addPair(address _pair) internal {
        address tokenX = ILBPair(_pair).getTokenX();
        address tokenY = ILBPair(_pair).getTokenY();

        _pairsByTokens[tokenX][tokenY].push(_pair);
        _pairsByTokens[tokenY][tokenX].push(_pair);
        _allPairs.push(_pair);

        isWhitelisted[_pair] = true;

        emit PairAdded(_pair, tokenX, tokenY);
    }

    function _removePairFromArray(address[] storage _pairs, address _pair) internal {
        uint256 length = _pairs.length;
        for (uint256 i; i < length; ++i) {
            if (_pairs[i] == _pair) {
                // Swap with last element and pop
                _pairs[i] = _pairs[length - 1];
                _pairs.pop();
                return;
            }
        }
    }

    function getPairsForTokens(address _tokenA, address _tokenB) external view returns (address[] memory) {
        return _pairsByTokens[_tokenA][_tokenB];
    }

    function getAllPairs() external view returns (address[] memory) {
        return _allPairs;
    }

    function _query(uint256 _amountIn, address _tokenIn, address _tokenOut)
        internal
        view
        override
        returns (uint256 amountOut)
    {
        address[] memory pairs = _pairsByTokens[_tokenIn][_tokenOut];

        // Early return if no whitelisted pairs for this token pair
        if (pairs.length == 0 || _amountIn == 0) {
            return 0;
        }

        (amountOut,,) = _getBestQuote(_amountIn, _tokenIn, _tokenOut, pairs);
    }

    function _swap(uint256 _amountIn, uint256 _minAmountOut, address _tokenIn, address _tokenOut, address _to)
        internal
        override
    {
        address[] memory pairs = _pairsByTokens[_tokenIn][_tokenOut];
        require(pairs.length > 0, "LB2WhitelistAdapter: no whitelisted pairs");

        (uint256 amountOut, address pair, bool swapForY) = _getBestQuote(_amountIn, _tokenIn, _tokenOut, pairs);
        require(amountOut >= _minAmountOut, "LB2WhitelistAdapter: insufficient amountOut");

        IERC20(_tokenIn).transfer(pair, _amountIn);
        ILBPair(pair).swap(swapForY, _to);
    }

    function _getBestQuote(uint256 _amountIn, address, address _tokenOut, address[] memory _pairs)
        internal
        view
        returns (uint256 amountOut, address pair, bool swapForY)
    {
        for (uint256 i; i < _pairs.length; ++i) {
            address currentPair = _pairs[i];
            bool forY = ILBPair(currentPair).getTokenY() == _tokenOut;
            uint256 swapAmountOut = _getQuote(currentPair, _amountIn, forY);

            if (swapAmountOut > amountOut) {
                amountOut = swapAmountOut;
                pair = currentPair;
                swapForY = forY;
            }
        }
    }

    function _getQuote(address _pair, uint256 _amountIn, bool _swapForY) internal view returns (uint256 out) {
        try ILBPair(_pair).getSwapOut{gas: quoteGasLimit}(uint128(_amountIn), _swapForY) returns (
            uint128 amountInLeft, uint128 amountOut, uint128
        ) {
            if (amountInLeft == 0) {
                out = amountOut;
            }
        } catch {}
    }
}

