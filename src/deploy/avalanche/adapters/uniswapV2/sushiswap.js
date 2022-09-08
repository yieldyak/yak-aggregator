const { deployUniV2Contract, addresses } = require('../../../utils')
const { unilikeFactories } = addresses.avalanche

const factory = unilikeFactories.sushiswap
const networkName = 'avalanche'
const name = 'SushiswapAdapter'
const tags = [ 'sushiswap' ]
const fee = 3

module.exports = deployUniV2Contract(networkName, tags, name, factory, fee)