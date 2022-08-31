// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./IERC20.sol";

interface ImYAK is IERC20 {
    function unmoon(uint256, address) external;

    function moon(uint256, address) external;
}
