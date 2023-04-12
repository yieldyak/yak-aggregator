const { deployAdapter, addresses } = require('../../../utils')
const { liquidityBook } = addresses.avalanche

const networkName = 'avalanche'
const tags = [ 'liquidity-book', 'joe-lb' ]
const name = 'LiquidityBookAdapter'
const contractName = 'LBAdapter'

const gasEstimate = 535_345
const router = liquidityBook.routerV1
const args = [ name, gasEstimate, router ]

module.exports = deployAdapter(networkName, tags, name, contractName, args)