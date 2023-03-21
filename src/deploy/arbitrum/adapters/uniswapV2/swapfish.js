const { deployUniV2Contract, addresses } = require('../../../utils')
const { factory } = addresses.arbitrum.swapfish

const networkName = 'arbitrum'
const name = 'SwapfishAdapter'
const tags = [ 'swapfish' ]
const fee = 3

module.exports = deployUniV2Contract(networkName, tags, name, factory, fee)