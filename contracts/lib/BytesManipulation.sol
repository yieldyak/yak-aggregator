// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0;

import "./BytesToTypes.sol";

library BytesManipulation {
    function toBytes(uint256 x) internal pure returns (bytes memory b) {
        b = new bytes(32);
        assembly {
            mstore(add(b, 32), x)
        }
    }

    function toBytes(address x) internal pure returns (bytes memory b) {
        b = new bytes(32);
        assembly {
            mstore(add(b, 32), x)
        }
    }

    function mergeBytes(bytes memory a, bytes memory b)
        public
        pure
        returns (bytes memory c)
    {
        // From https://ethereum.stackexchange.com/a/40456
        uint256 alen = a.length;
        uint256 totallen = alen + b.length;
        uint256 loopsa = (a.length + 31) / 32;
        uint256 loopsb = (b.length + 31) / 32;
        assembly {
            let m := mload(0x40)
            mstore(m, totallen)
            for {
                let i := 0
            } lt(i, loopsa) {
                i := add(1, i)
            } {
                mstore(
                    add(m, mul(32, add(1, i))),
                    mload(add(a, mul(32, add(1, i))))
                )
            }
            for {
                let i := 0
            } lt(i, loopsb) {
                i := add(1, i)
            } {
                mstore(
                    add(m, add(mul(32, add(1, i)), alen)),
                    mload(add(b, mul(32, add(1, i))))
                )
            }
            mstore(0x40, add(m, add(32, totallen)))
            c := m
        }
    }

    function bytesToAddress(uint256 _offst, bytes memory _input)
        internal
        pure
        returns (address)
    {
        return BytesToTypes.bytesToAddress(_offst, _input);
    }

    function bytesToUint256(uint256 _offst, bytes memory _input)
        internal
        pure
        returns (uint256)
    {
        return BytesToTypes.bytesToUint256(_offst, _input);
    }
}
