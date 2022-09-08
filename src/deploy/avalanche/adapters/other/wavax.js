const { deployAdapter } = require('../../../utils')

const networkName = 'avalanche'
const tags = [ 'wavax' ]
const name = 'WAvaxAdapter'
const contractName = 'WAvaxAdapter'

const gasEstimate = 1
const args = [ gasEstimate ]

module.exports = deployAdapter(networkName, tags, name, contractName, args)