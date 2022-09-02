// From https://github.com/pouladzade/Seriality/blob/master/src/BytesToTypes.sol (Licensed under Apache2.0)

// SPDX-License-Identifier: Apache2.0
pragma solidity ^0.8.0;

library BytesToTypes {
    function bytesToAddress(uint256 _offst, bytes memory _input) internal pure returns (address _output) {
        assembly {
            _output := mload(add(_input, _offst))
        }
    }

    function bytesToUint256(uint256 _offst, bytes memory _input) internal pure returns (uint256 _output) {
        assembly {
            _output := mload(add(_input, _offst))
        }
    }
}
