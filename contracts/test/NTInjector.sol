// Inject native-token into contract without fallback function
pragma solidity >=0.7.0;

contract NTInjector {

    constructor() payable {}

    function injectFunds(address payable _reciever) external {
        selfdestruct(_reciever);
    }

    /*
    Simpler version:
    
        constructor(address payable _reciever) payable {
            selfdestruct(_reciever);
        }

    */

}