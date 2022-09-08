const { deployAdapter } = require('../../../utils')

const networkName = 'avalanche'
const tags = [ 'xjoe' ]
const name = 'XJoeAdapter'
const contractName = 'XJoeAdapter'

const gasEstimate = 150_000
const args = [ gasEstimate ]

module.exports = deployAdapter(networkName, tags, name, contractName, args)