const { deployUniV2Contract, addresses } = require("../../../utils");
const { unilikeFactories } = addresses.avalanche;

const factory = unilikeFactories.arena;
const networkName = "avalanche";
const name = "ArenaAdapter";
const tags = ["arena"];
const fee = 3;

module.exports = deployUniV2Contract(networkName, tags, name, factory, fee);
