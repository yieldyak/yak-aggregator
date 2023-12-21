const { deployAdapter, addresses } = require('../../../utils')
const { factory, quoter } = addresses.avalanche.pharaoh

const networkName = 'avalanche'
const contractName = 'RamsesV2Adapter'
const tags = [ 'pharaoh' ]
const name = 'PharaohAdapter'
const gasEstimate = 300_000
const quoterGasLimit = gasEstimate - 60_000
const defaultFees = [50, 100, 250, 500, 3_000, 10_000]
const args = [ name, gasEstimate, quoterGasLimit, quoter, factory, defaultFees ]

module.exports = deployAdapter(networkName, tags, contractName, contractName, args)