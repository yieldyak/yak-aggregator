const { deployUniV2Contract, addresses } = require('../../../utils')

const factory = addresses.dogechain.univ2.factories.dogeswap
const networkName = 'dogechain'
const name = 'DogeSwapAdapter'
const tags = [ 'dogeswap' ]
const fee = 2

module.exports = deployUniV2Contract(networkName, tags, name, factory, fee)