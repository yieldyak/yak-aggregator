const { deployAdapter, addresses } = require('../../../utils')
const { ButtonTokenFactory } = addresses.avalanche.other

const networkName = 'avalanche'
const tags = [ 'buttonwood', 'button-wrappers' ]
const name = 'ButtonWrappersAdapter'
const contractName = 'ButtonWrappersAdapter'

const gasEstimate = 10
const factory = ButtonTokenFactory
const args = [ name, factory, gasEstimate ]

module.exports = deployAdapter(networkName, tags, name, contractName, args)
