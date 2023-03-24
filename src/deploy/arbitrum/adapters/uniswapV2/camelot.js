const { deployAdapter, addresses } = require('../../../utils')
const { factory } = addresses.arbitrum.camelot

const networkName = 'arbitrum'
const contractName = 'CamelotAdapter'
const tags = [ 'camelot' ]
const name = contractName
const gasEstimate = 238_412
const args = [ name, factory, gasEstimate ]

module.exports = deployAdapter(networkName, tags, contractName, contractName, args)