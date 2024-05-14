const { deployAdapter } = require('../../../utils')

const networkName = 'avalanche'
const tags = [ 'ggavax' ]
const name = 'GGAvaxAdapter'
const contractName = 'GGAvaxAdapter'

const gasEstimate = 180_000
const args = [ gasEstimate ]

module.exports = deployAdapter(networkName, tags, name, contractName, args)