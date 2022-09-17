const { deployAdapter, addresses } = require('../../../utils')
const { quickswap } = addresses.dogechain

const networkName = 'dogechain'
const tags = [ 'quickswap', 'algebra' ]
const name = 'QuickswapAdapter'
const contractName = 'AlgebraAdapter'

const gasEstimate = 250_000
const quoterGasLimit = gasEstimate
const factory = quickswap.quickswapFactory
const quoter = quickswap.algebraQuoter
const args = [ name, gasEstimate, quoterGasLimit, quoter, factory ]

module.exports = deployAdapter(networkName, tags, name, contractName, args)