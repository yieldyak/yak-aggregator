const { deployAdapter, addresses } = require("../../../utils");
const { wombat } = addresses.arbitrum;

const networkName = "arbitrum";
const tags = ["wombat"];
const name = "WombatAdapter";
const contractName = "WombatAdapter";

const gasEstimate = 280_000;
const pools = [wombat.main, wombat.frax_sfrax_usdc, wombat.frax_usdv, wombat.frxETH, wombat.fusdc, wombat.mpendle_pendle];
const args = [name, gasEstimate, pools];

module.exports = deployAdapter(networkName, tags, name, contractName, args);
