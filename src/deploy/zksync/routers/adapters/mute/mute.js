const { deployAdapter, addresses } = require('../../../../utils')
const { factory } = addresses.zksync.mute

const networkName = 'zksync'
const tags = [ 'mute' ]
const name = 'MuteAdapter'
const contractName = 'VelocoreAdapter'

const gasEstimate = 280_000
const args = [ name, factory, gasEstimate ]

module.exports = deployAdapter(networkName, tags, name, contractName, args)