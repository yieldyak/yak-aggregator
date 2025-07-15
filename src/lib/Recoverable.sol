// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "./SafeERC20.sol";
import "./Maintainable.sol";


abstract contract Recoverable is Maintainable {
    using SafeERC20 for IERC20;

    event Recovered(
        address indexed _asset, 
        uint amount
    );

    /**
     * @notice Recover ERC20 from contract
     * @param _tokenAddress token address
     * @param _tokenAmount amount to recover
     */
    function recoverERC20(address _tokenAddress, uint _tokenAmount) external onlyMaintainer {
        require(_tokenAmount > 0, "Nothing to recover");
        IERC20(_tokenAddress).safeTransfer(msg.sender, _tokenAmount);
        emit Recovered(_tokenAddress, _tokenAmount);
    }

    /**
     * @notice Recover native asset from contract
     * @param _amount amount
     */
    function recoverNative(uint _amount) external onlyMaintainer {
        require(_amount > 0, "Nothing to recover");
        payable(msg.sender).transfer(_amount);
        emit Recovered(address(0), _amount);
    }

}