// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.4;

// https://github.com/buttonwood-protocol/buttonswap-core/blob/main/src/interfaces/IButtonswapFactory/IButtonswapFactory.sol
interface IButtonswapFactory {
    /**
     * @notice Get the (unique) Pair address created for the given combination of `tokenA` and `tokenB`.
     * If the Pair does not exist then zero address is returned.
     * @param tokenA The first unsorted token
     * @param tokenB The second unsorted token
     * @return pair The address of the Pair instance
     */
    function getPair(address tokenA, address tokenB) external view returns (address pair);
}
