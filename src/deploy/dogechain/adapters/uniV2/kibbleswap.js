const { deployUniV2Contract, addresses } = require('../../../utils')

const factory = addresses.dogechain.univ2.factories.kibbleswap
const networkName = 'dogechain'
const name = 'KibbleSwapAdapter'
const tags = [ 'kibbleswap' ]
const fee = 3

module.exports = deployUniV2Contract(networkName, tags, name, factory, fee)
