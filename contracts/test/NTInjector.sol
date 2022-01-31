// Inject native-token into contract without fallback function
pragma solidity >=0.7.0;

contract NTInjector {

    constructor() payable {}

    function injectFunds(address payable _reciever) external {
        selfdestruct(_reciever);
    }

}