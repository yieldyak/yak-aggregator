const { deployAdapter, addresses } = require('../../../utils')
const { factory, quoter } = addresses.arbitrum.ramses

const networkName = 'arbitrum'
const contractName = 'RamsesV2Adapter'
const tags = [ 'ramses' ]
const name = 'RamsesAdapter'
const gasEstimate = 400_000
const quoterGasLimit = gasEstimate - 60_000
const defaultFees = [50, 100, 250, 500, 3_000, 10_000]
const args = [ name, gasEstimate, quoterGasLimit, quoter, factory, defaultFees ]

module.exports = deployAdapter(networkName, tags, contractName, contractName, args)