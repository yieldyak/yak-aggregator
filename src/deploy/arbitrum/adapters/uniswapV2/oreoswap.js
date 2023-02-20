const { deployUniV2Contract, addresses } = require('../../../utils')
const { factory } = addresses.arbitrum.oreoswap

const networkName = 'arbitrum'
const name = 'OreoswapAdapter'
const tags = [ 'oreoswap' ]
const fee = 3

module.exports = deployUniV2Contract(networkName, tags, name, factory, fee)