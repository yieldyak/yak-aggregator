const { deployAdapter, addresses } = require("../../../utils");
const { wombat } = addresses.avalanche;

const networkName = "avalanche";
const tags = ["wombat"];
const name = "WombatAdapter";
const contractName = "WombatAdapter";

const gasEstimate = 290_000;
const pools = [wombat.savax, wombat.main, wombat.usdv];
const args = [name, gasEstimate, pools];

module.exports = deployAdapter(networkName, tags, name, contractName, args);
