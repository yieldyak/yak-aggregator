const { deployAdapter, addresses } = require('../../../../utils')
const { factory, stableFactory, vault } = addresses.zksync.syncSwap

const networkName = 'zksync'
const tags = [ 'syncswap' ]
const name = 'SyncSwapAdapter'
const contractName = 'SyncSwapAdapter'

const gasEstimate = 280_000
const args = [ name, factory, stableFactory, vault, gasEstimate ]

module.exports = deployAdapter(networkName, tags, name, contractName, args)