const { deployAdapter, addresses } = require("../../../utils");
const { factory } = addresses.base.aerodrom;

const networkName = "base";
const tags = ["aerodrom"];
const name = "AerodromAdapter";
const contractName = "VelodromeV2Adapter";

const gasEstimate = 4e5;
const args = [name, factory, gasEstimate];

module.exports = deployAdapter(networkName, tags, name, contractName, args);
