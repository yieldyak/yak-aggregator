const { deployAdapter, addresses } = require("../../../utils");
const { CurveAtricrypto } = addresses.avalanche.curvelikePools;
const { WBTCe } = addresses.avalanche.assets;

const networkName = "avalanche";
const tags = ["curve", "curveAtricrypto"];
const name = "CurveAtricryptoAdapter";
const contractName = "Curve1Adapter";

const gasEstimate = 1_500_000;
const pool = CurveAtricrypto;
const blacklist = [WBTCe];
const args = [name, pool, blacklist, gasEstimate];

module.exports = deployAdapter(networkName, tags, name, contractName, args);
