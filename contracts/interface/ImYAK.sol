// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0;

import "./IERC20.sol";

interface ImYAK is IERC20 {
    function unmoon(uint, address) external;
    function moon(uint, address) external;
}