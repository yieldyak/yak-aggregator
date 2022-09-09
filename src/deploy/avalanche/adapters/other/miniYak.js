const { deployAdapter } = require('../../../utils')

const networkName = 'avalanche'
const tags = [ 'miniyak' ]
const name = 'MiniYakAdapter'
const contractName = 'MiniYakAdapter'

const gasEstimate = 82_000
const args = [ gasEstimate ]

module.exports = deployAdapter(networkName, tags, name, contractName, args)