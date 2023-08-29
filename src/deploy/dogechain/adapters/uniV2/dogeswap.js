const { deployUniV2Contract, addresses } = require('../../../utils')

const factory = addresses.dogechain.univ2.factories.dogeswap
const networkName = 'dogechain'
const name = 'DogeSwapAdapter'
const tags = [ 'dogeswap' ]
const fee = 2
const feeDenominator = 1000

module.exports = deployUniV2Contract(networkName, tags, name, factory, fee, feeDenominator)