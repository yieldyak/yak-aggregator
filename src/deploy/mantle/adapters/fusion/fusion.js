const { deployAdapter, addresses } = require('../../../utils')
const { factory, quoter } = addresses.mantle.fusion

const networkName = 'mantle'
const contractName = 'FusionAdapter'
const tags = [ 'fusion' ]
const name = contractName
const gasEstimate = 420_000
const quoterGasLimit = gasEstimate - 60_000
const defaultFees = [100, 500, 2_500, 10_000]
const args = [ name, gasEstimate, quoterGasLimit, quoter, factory, defaultFees ]

module.exports = deployAdapter(networkName, tags, contractName, contractName, args)