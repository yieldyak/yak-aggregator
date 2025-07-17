// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Inject native-token into contract without fallback function
contract NTInjector {
    constructor(address payable _reciever) payable {
        selfdestruct(_reciever);
    }
}
