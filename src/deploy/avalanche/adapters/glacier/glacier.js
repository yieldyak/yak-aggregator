const { deployAdapter, addresses } = require('../../../utils')
const { GlacierFactory: factory } = addresses.avalanche.other

const networkName = 'avalanche'
const tags = [ 'glacier' ]
const name = 'GlacierAdapter'
const contractName = 'VelodromeAdapter'

const gasEstimate = 280_000
const args = [ name, factory, gasEstimate ]

module.exports = deployAdapter(networkName, tags, name, contractName, args)