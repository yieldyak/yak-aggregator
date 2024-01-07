const { deployAdapter, addresses } = require('../../../../utils')
const { factory } = addresses.zksync.velocore

const networkName = 'zksync'
const tags = [ 'velocore' ]
const name = 'VelocoreAdapter'
const contractName = 'VelocoreAdapter'

const gasEstimate = 280_000
const args = [ name, factory, gasEstimate ]

module.exports = deployAdapter(networkName, tags, name, contractName, args)