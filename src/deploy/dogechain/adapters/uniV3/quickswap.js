const { deployAdapter, addresses } = require('../../../utils')
const { quickswap } = addresses.dogechain

const networkName = 'dogechain'
const tags = [ 'quickswap', 'algebra' ]
const name = 'QuickswapAdapter'
const contractName = 'AlgebraAdapter'

const gasEstimate = 800_000
const factory = quickswap.quickswapFactory
const quoter = quickswap.algebraQuoter
const args = [ name, factory, quoter, gasEstimate ]

module.exports = deployAdapter(networkName, tags, name, contractName, args)