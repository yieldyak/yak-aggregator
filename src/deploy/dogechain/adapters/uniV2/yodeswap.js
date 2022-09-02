const { deployUniV2Contract, addresses } = require('../../../utils')

const factory = addresses.dogechain.univ2.factories.yodeswap
const networkName = 'dogechain'
const name = 'YodeSwapAdapter'
const tags = [ 'yodeswap' ]
const fee = 5

module.exports = deployUniV2Contract(networkName, tags, name, factory, fee)