// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.0;

import {Test} from "forge-std/Test.sol";
import {AdapterTestBase} from "../AdapterTestBase.sol";

contract AvalancheTestBase is AdapterTestBase {
    // Common Avalanche tokens
    address public constant WAVAX = 0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7;
    address public constant USDC = 0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E;
    address public constant USDT = 0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7;
    address public constant BLACK = 0xcd94a87696FAC69Edae3a70fE5725307Ae1c43f6;
    address public constant SUPER = 0x09Fa58228bB791ea355c90DA1e4783452b9Bd8C3;
}
