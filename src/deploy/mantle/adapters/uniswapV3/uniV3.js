const { deployAdapter, addresses } = require("../../../utils");
const { factory, quoter } = addresses.mantle.uniV3;

const networkName = "mantle";
const contractName = "UniswapV3Adapter";
const tags = ["uniswapV3"];
const name = contractName;
const gasEstimate = 240_000;
const quoterGasLimit = 300_000;
const defaultFees = [500, 3_000, 10_000];
const args = [name, gasEstimate, quoterGasLimit, quoter, factory, defaultFees];

module.exports = deployAdapter(networkName, tags, contractName, contractName, args);
