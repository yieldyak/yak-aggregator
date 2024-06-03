const { deployAdapter, addresses } = require("../../../utils");
const { aArbUSDCn } = addresses.arbitrum.assets;

const networkName = "arbitrum";
const tags = ["aave_usdc"];
const name = "AaveUSDCAdapter";
const contractName = "AaveAdapter";

const gasEstimate = 170_000;
const args = [name, aArbUSDCn, gasEstimate];

module.exports = deployAdapter(networkName, tags, name, contractName, args);
