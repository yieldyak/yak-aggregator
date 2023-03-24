const { deployUniV2Contract, addresses } = require('../../../utils')
const { factory } = addresses.arbitrum.sushiswap

const networkName = 'arbitrum'
const name = 'SushiswapAdapter'
const tags = [ 'sushiswap' ]
const fee = 3

module.exports = deployUniV2Contract(networkName, tags, name, factory, fee)