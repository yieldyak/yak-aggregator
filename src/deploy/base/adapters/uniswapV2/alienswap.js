const { deployUniV2Contract, addresses } = require("../../../utils");
const { univ2 } = addresses.base;

const factory = univ2.factories.alienbase;
const networkName = "base";
const name = "AlienBaseAdapter";
const tags = ["alienbase"];
const fee = 16;
const feeDenominator = 10000;

module.exports = deployUniV2Contract(networkName, tags, name, factory, fee, feeDenominator);
