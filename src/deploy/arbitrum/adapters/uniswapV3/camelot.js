const { deployAdapter, addresses } = require('../../../utils')
const { camelot, other } = addresses.arbitrum

const networkName = 'arbitrum'
const tags = [ 'camelot_algebra' ]
const name = 'CamelotAlgebraAdapter'
const contractName = 'AlgebraAdapter'

const gasEstimate = 250_000
const quoterGasLimit = gasEstimate
const factory = camelot.algebraFactory
const quoter = other.algebraQuoter
const args = [ name, gasEstimate, quoterGasLimit, quoter, factory ]

module.exports = deployAdapter(networkName, tags, name, contractName, args)