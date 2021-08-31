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
pragma solidity >=0.7.0;

import "../interface/IERC20.sol";
import "../lib/SafeERC20.sol";
import "../YakAdapter.sol";

import "hardhat/console.sol";

contract BridgeMigrationAdapter is YakAdapter {
    using SafeERC20 for IERC20;

    bytes32 public constant ID = keccak256('BridgeMigrationAdapter');
    mapping(address => bool) public isNewBridgeToken;

    constructor(
        address[] memory _newTokens, 
        address[] memory _oldTokens,
        uint _swapGasEstimate
    ) {
        setSwapGasEstimate(_swapGasEstimate);
        setNewBridgeTokens(_newTokens, _oldTokens);
    }

    function _approveIfNeeded(address _tokenIn, uint _amount) internal override {}

    function _approveIfNeeded(address _newToken, address _oldToken) internal {
        uint allowance = IERC20(_oldToken).allowance(address(this), _newToken);
        if (allowance < UINT_MAX) {
            IERC20(_oldToken).safeApprove(_newToken, UINT_MAX);
        }
    }

    function _query(
        uint _amountIn, 
        address _tokenIn, 
        address _tokenOut
    ) internal override view returns (uint amountOut) {  
        if (
            isNewBridgeToken[_tokenOut]
            && IERC20(_tokenOut).swapSupply(_tokenIn) >= _amountIn
        ) {
            amountOut = _amountIn;
        }
    }

    function _swap(
        uint _amountIn, 
        uint _amountOut, 
        address _tokenIn, 
        address _tokenOut, 
        address _to
    ) internal override {
        IERC20(_tokenOut).swap(_tokenIn, _amountIn);
        _returnTo(_tokenOut, _amountOut, _to);
    }

    function setAllowances() public override {}

    function setNewBridgeTokens(address[] memory _newTokens, address[] memory _oldTokens) public onlyOwner {
        require(_newTokens.length == _oldTokens.length, 'BridgeMigrationAdapter: Needs to be surjective');
        for (uint i; i<_newTokens.length; i++) {
            require(IERC20(_newTokens[i]).swapSupply(_oldTokens[i]) > 0, 'BridgeMigrationAdapter: Invalid combination');
            _approveIfNeeded(_newTokens[i], _oldTokens[i]);
            isNewBridgeToken[_newTokens[i]] = true;
        }
    }
}