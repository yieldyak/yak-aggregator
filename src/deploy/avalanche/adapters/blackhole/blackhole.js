const { deployAdapter, addresses } = require('../../../utils')
const { factory } = addresses.avalanche.blackhole

const networkName = 'avalanche'
const contractName = 'BlackholeV1Adapter'
const tags = [ 'blackhole' ]
const name = 'BlackholeV1Adapter'
const gasEstimate = 340_000
const args = [ name, factory, gasEstimate ]

module.exports = deployAdapter(networkName, tags, name, contractName, args)