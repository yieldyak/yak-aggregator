const { deployAdapter, addresses } = require("../../../utils");
const { factory, quoter } = addresses.mantle.cleopatra.cl;

const networkName = "mantle";
const contractName = "RamsesV2Adapter";
const tags = ["cleopatra_cl"];
const name = "CleopatraClAdapter";
const gasEstimate = 425_000;
const quoterGasLimit = gasEstimate - 60_000;
const defaultFees = [100, 500, 3_000, 10_000];
const args = [name, gasEstimate, quoterGasLimit, quoter, factory, defaultFees];

module.exports = deployAdapter(networkName, tags, name, contractName, args);
