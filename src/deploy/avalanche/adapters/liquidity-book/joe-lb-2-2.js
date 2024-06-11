const { deployAdapter, addresses } = require("../../../utils");
const { liquidityBook } = addresses.avalanche;

const networkName = "avalanche";
const tags = ["lb22"];
const name = "LiquidityBook2.2Adapter";
const contractName = "LB2Adapter";

const gasEstimate = 1_000_000;
const quoteGasLimit = 600_000;
const factory = liquidityBook.factoryV22;
const args = [name, gasEstimate, quoteGasLimit, factory];

module.exports = deployAdapter(networkName, tags, name, contractName, args);
