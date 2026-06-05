// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.0;

import {AdapterTestBase} from "../AdapterTestBase.sol";

contract BaseTestBase is AdapterTestBase {
    // Common Base tokens
    address public constant WETH = 0x4200000000000000000000000000000000000006;
    address public constant msETH = 0x7Ba6F01772924a82D9626c126347A28299E98c98;
}
