// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "../YakWrapper.sol";


interface ISomeExternalContract {
    function getWhitelistedTokens() external view returns (address[] memory);
    function getWrappedToken() external view returns (address);
    
    function queryMint(address from, uint amount) external view returns (uint256);
    function queryBurn(address to, uint amount) external view returns (uint256);

    function mintWrappedToken(address from, uint amount) external;
    function burnWrappedToken(address to, uint amount) external;
}

contract TestWrapper is YakWrapper {
    using SafeERC20 for IERC20;

    address internal immutable someExternalContract;
    mapping(address => bool) internal isWhitelisted;
    address internal immutable wrappedToken;
    address[] internal whitelistedTokens;

    constructor(
        string memory _name, 
        uint256 _gasEstimate, 
        address _someExternalContract
    ) YakWrapper(_name, _gasEstimate) {
        whitelistedTokens = ISomeExternalContract(_someExternalContract).getWhitelistedTokens();
        wrappedToken = ISomeExternalContract(_someExternalContract).getWrappedToken();
        someExternalContract = _someExternalContract;
    }

    function setWhitelistedTokens(address[] memory tokens) public onlyMaintainer {
        for (uint i = 0; i < whitelistedTokens.length; i++) {
            isWhitelisted[whitelistedTokens[i]] = false;
        }
        whitelistedTokens = tokens;
        for (uint i = 0; i < tokens.length; i++) {
            isWhitelisted[tokens[i]] = true;
        }
    }

    function getTokensIn() override external view returns (address[] memory) {
        return whitelistedTokens;
    }

    function getTokensOut() override external view returns (address[] memory) {
        return whitelistedTokens;
    }

    function getWrappedToken() override external view returns (address) {
        return wrappedToken;
    }

    function _query(
        uint256 _amountIn,
        address _tokenIn,
        address _tokenOut
    ) override internal view returns (uint256) {
        if (_tokenIn == wrappedToken && isWhitelisted[_tokenOut]) {
            return ISomeExternalContract(someExternalContract).queryBurn(_tokenOut, _amountIn);
        } else if (_tokenOut == wrappedToken && isWhitelisted[_tokenIn]) {
            return ISomeExternalContract(someExternalContract).queryMint(_tokenIn, _amountIn);
        } else {
            return 0;
        }
    }

    function _swap(
        uint256 _amountIn,
        uint256 _amountOut,
        address _tokenIn,
        address _tokenOut,
        address _to
    ) override internal {
        if (_tokenIn == wrappedToken && isWhitelisted[_tokenOut]) {
            IERC20(_tokenOut).safeTransfer(someExternalContract, _amountIn);
            ISomeExternalContract(someExternalContract).burnWrappedToken(_tokenOut, _amountIn);
        } else if (_tokenOut == wrappedToken && isWhitelisted[_tokenIn]) {
            IERC20(_tokenIn).safeTransfer(someExternalContract, _amountIn);
            ISomeExternalContract(someExternalContract).mintWrappedToken(_tokenIn, _amountIn);
        } else {
            revert("Invalid token pair");
        }
        _returnTo(_tokenOut, _amountOut, _to);
    }

}