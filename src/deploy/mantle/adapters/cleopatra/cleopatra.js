const { deployAdapter, addresses } = require("../../../utils");
const { legacy } = addresses.mantle.cleopatra;

const networkName = "mantle";
const contractName = "VelodromeAdapter";
const tags = ["cleopatra_legacy"];
const name = "CleopatraAdapter";
const gasEstimate = 370_000;
const args = [name, legacy.factory, gasEstimate];

module.exports = deployAdapter(networkName, tags, name, contractName, args);
