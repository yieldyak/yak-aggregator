const { deployAdapter, addresses } = require('../../../utils')
const { factoryV3, quoter } = addresses.arbitrum.pancake

const networkName = 'arbitrum'
const contractName = 'PancakeV3Adapter'
const tags = [ 'pancakeV3' ]
const name = 'PancakeV3Adapter'
const gasEstimate = 385_000
const quoterGasLimit = gasEstimate - 60_000
const defaultFees = [100, 500, 2500, 10_000]
const args = [ name, gasEstimate, quoterGasLimit, quoter, factoryV3, defaultFees ]

module.exports = deployAdapter(networkName, tags, contractName, contractName, args)