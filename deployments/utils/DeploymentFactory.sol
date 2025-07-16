// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./INetworkDeployments.sol";
import "../AvalancheDeployments.sol";

contract DeploymentFactory {
    error UnsupportedNetwork(uint256 chainId);

    function getDeployments() public returns (INetworkDeployments) {
        uint256 chainId = block.chainid;

        if (chainId == 43114) {
            return INetworkDeployments(address(new AvalancheDeployments()));
        } else {
            revert UnsupportedNetwork(chainId);
        }
    }

    function getDeploymentsByChainId(uint256 chainId) public returns (INetworkDeployments) {
        if (chainId == 43114) {
            return INetworkDeployments(address(new AvalancheDeployments()));
        } else {
            revert UnsupportedNetwork(chainId);
        }
    }

    function getSupportedNetworks() public pure returns (uint256[] memory chainIds, string[] memory names) {
        chainIds = new uint256[](1);
        names = new string[](1);

        chainIds[0] = 43114;
        names[0] = "Avalanche";
    }
}
