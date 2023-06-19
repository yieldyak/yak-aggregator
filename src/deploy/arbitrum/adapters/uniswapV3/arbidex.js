const { deployAdapter, addresses } = require('../../../utils')
const { factory, quoter } = addresses.arbitrum.arbidex

const networkName = 'arbitrum'
const contractName = 'UniswapV3Adapter'
const tags = [ 'arbidex' ]
const name = "ArbiDexAdapter"
const gasEstimate = 300_000
const quoterGasLimit = 300_000
const defaultFees = [80, 450, 2_500, 10_000]
const args = [ name, gasEstimate, quoterGasLimit, quoter, factory, defaultFees ]

module.exports = deployAdapter(networkName, tags, name, contractName, args)