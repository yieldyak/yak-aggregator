// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./INetworkDeployments.sol";
import "../AvalancheDeployments.sol";
import "../BaseDeployments.sol";

contract DeploymentFactory {
    error UnsupportedNetwork(uint256 chainId);

    function getDeployments() public returns (INetworkDeployments) {
        uint256 chainId = block.chainid;

        if (chainId == 43114) {
            return INetworkDeployments(address(new AvalancheDeployments()));
        } else if (chainId == 8453) {
            return INetworkDeployments(address(new BaseDeployments()));
        } else {
            revert UnsupportedNetwork(chainId);
        }
    }

    function getDeploymentsByChainId(uint256 chainId) public returns (INetworkDeployments) {
        if (chainId == 43114) {
            return INetworkDeployments(address(new AvalancheDeployments()));
        } else if (chainId == 8453) {
            return INetworkDeployments(address(new BaseDeployments()));
        } else {
            revert UnsupportedNetwork(chainId);
        }
    }

    function getSupportedNetworks() public pure returns (uint256[] memory chainIds, string[] memory names) {
        chainIds = new uint256[](2);
        names = new string[](2);

        chainIds[0] = 43114;
        names[0] = "Avalanche";
        chainIds[1] = 8453;
        names[1] = "Base";
    }
}
