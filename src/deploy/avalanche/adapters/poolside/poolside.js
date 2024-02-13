const { deployAdapter, addresses } = require('../../../utils')
const { PoolsideV1Factory } = addresses.avalanche.other

const networkName = 'avalanche'
const tags = [ 'poolside' ]
const name = 'PoolsideV1Adapter'
const contractName = 'PoolsideV1Adapter'

const gasEstimate = 279_220
const factory = PoolsideV1Factory
const args = [ name, factory, gasEstimate ]

module.exports = deployAdapter(networkName, tags, name, contractName, args)
