const { deployAdapter, addresses } = require('../../../utils')
const { liquidityBook } = addresses.arbitrum

const networkName = 'arbitrum'
const tags = [ 'liquidity-book', 'joe-lb' ]
const name = 'LiquidityBookAdapter'
const contractName = 'LBAdapter'

const gasEstimate = 535_345
const args = [ name, gasEstimate, liquidityBook.routerV1 ]

module.exports = deployAdapter(networkName, tags, name, contractName, args)