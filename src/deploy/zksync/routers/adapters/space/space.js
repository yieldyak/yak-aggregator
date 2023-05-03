const { deployUniV2Contract, addresses } = require("../../../../utils");
const { space: factory } = addresses.zksync.univ2Factories;

const networkName = "zksync";
const name = "SpaceAdapter";
const tags = ["space"];
const fee = 3;

module.exports = deployUniV2Contract(networkName, tags, name, factory, fee);
