const { deployAdapter, addresses } = require('../../../utils')
const { factory } = addresses.optimism.velodrome

const networkName = 'optimism'
const tags = [ 'velodrome' ]
const name = 'VelodromeAdapter'
const contractName = 'VelodromeAdapter'

const gasEstimate = 280_000
const args = [ name, factory, gasEstimate ]

module.exports = deployAdapter(networkName, tags, name, contractName, args)