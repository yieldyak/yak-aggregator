const { deployAdapter, addresses } = require('../../../utils')
const { liquidityBook } = addresses.arbitrum

const networkName = 'arbitrum'
const tags = [ 'liquidity-book', 'lb2' ]
const name = 'LiquidityBook2Adapter'
const contractName = 'LB2Adapter'

const gasEstimate = 1_000_000
const quoteGasLimit = 600_000
const factory = liquidityBook.factoryV2
const args = [ name, gasEstimate, quoteGasLimit, factory ]

module.exports = deployAdapter(networkName, tags, name, contractName, args)