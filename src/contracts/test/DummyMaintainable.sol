// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../lib/Maintainable.sol";

contract DummyMaintainable is Maintainable {
    function onlyMaintainerFunction() public onlyMaintainer {}
}
