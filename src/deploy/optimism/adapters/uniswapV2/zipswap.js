const { deployUniV2Contract, addresses } = require('../../../utils')
const { zipswap: factory } = addresses.optimism.univ2Factories

const networkName = 'optimism'
const name = 'ZipswapAdapter'
const tags = [ 'zipswap' ]
const fee = 3

module.exports = deployUniV2Contract(networkName, tags, name, factory, fee)