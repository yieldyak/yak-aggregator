// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;


library TypeConversion {

    function toBytes12(address x) internal pure returns (bytes12 y) {
        assembly { y := x }
    }

    function toBytes32(address x) internal pure returns (bytes32 y) {
        assembly { y := x }
    }

    function toAddress(bytes32 x) internal pure returns (address y) {
        assembly { y := x }
    }

    function toBytes(address x) internal pure returns (bytes memory y) {
        y = new bytes(32);
        assembly { mstore(add(y, 32), x) }
    }

    function toBytes(bytes32 x) internal pure returns (bytes memory y) {
        y = new bytes(32);
        assembly { mstore(add(y, 32), x) }
    }

    function toBytes(uint x) internal pure returns (bytes memory y) {
        y = new bytes(32);
        assembly { mstore(add(y, 32), x) }
    }

    function toAddress(
        bytes memory x,
        uint offset
    ) internal pure returns (address y) {
        assembly { y := mload(add(x, offset)) }
    }

    function toUint(
        bytes memory x,
        uint offset
    ) internal pure returns (uint y) {
        assembly { y := mload(add(x, offset)) }
    }

    function toBytes12(
        bytes memory x,
        uint offset
    ) internal pure returns (bytes12 y) {
        assembly { y := mload(add(x, offset)) }
    }

    function toBytes32(
        bytes memory x,
        uint offset
    ) internal pure returns (bytes32 y) {
        assembly { y := mload(add(x, offset)) }
    }

    function toAddresses(
        bytes memory xs
    ) internal pure returns (address[] memory ys) {
        ys = new address[](xs.length/32);
        for (uint i=0; i < xs.length/32; i++) {
            ys[i] = toAddress(xs, i*32 + 32);
        }
    }

    function toUints(
        bytes memory xs
    ) internal pure returns (uint[] memory ys) {
        ys = new uint[](xs.length/32);
        for (uint i=0; i < xs.length/32; i++) {
            ys[i] = toUint(xs, i*32 + 32);
        }
    }

    function toBytes32s(
        bytes memory xs
    ) internal pure returns (bytes32[] memory ys) {
        ys = new bytes32[](xs.length/32);
        for (uint i=0; i < xs.length/32; i++) {
            ys[i] = toBytes32(xs, i*32 + 32);
        }
    }

}
