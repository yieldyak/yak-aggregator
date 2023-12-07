const { deployAdapter, addresses } = require('../../../utils')
const { factory, quoter } = addresses.base.sushiV3

const networkName = 'base'
const contractName = 'UniswapV3Adapter'
const tags = [ 'sushiV3' ]
const name = 'SushiV3Adapter'
const gasEstimate = 300_000
const quoterGasLimit = 300_000
const defaultFees = [500, 3_000, 10_000]
const args = [ name, gasEstimate, quoterGasLimit, quoter, factory, defaultFees ]

module.exports = deployAdapter(networkName, tags, name, contractName, args)