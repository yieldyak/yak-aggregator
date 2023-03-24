const { deployAdapter, addresses } = require('../../../utils')
const { lb_router } = addresses.arbitrum.other

const networkName = 'arbitrum'
const tags = [ 'liquidity-book', 'joe-lb' ]
const name = 'LiquidityBookAdapter'
const contractName = 'LBAdapter'

const gasEstimate = 535_345
const args = [ name, gasEstimate, lb_router ]

module.exports = deployAdapter(networkName, tags, name, contractName, args)