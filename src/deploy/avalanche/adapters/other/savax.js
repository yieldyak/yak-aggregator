const { deployAdapter } = require('../../../utils')

const networkName = 'avalanche'
const tags = [ 'savax' ]
const name = 'SAvaxAdapter'
const contractName = 'SAvaxAdapter'

const gasEstimate = 170_000
const args = [ gasEstimate ]

module.exports = deployAdapter(networkName, tags, name, contractName, args)