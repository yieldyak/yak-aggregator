const { deployAdapter, addresses } = require('../../../utils')
const { factory, quoter } = addresses.arbitrum.reservoir

const networkName = 'arbitrum'
const tags = [ 'reservoir', 'stableswap' ]
const name = 'ReservoirAdapter'
const contractName = 'ReservoirAdapter'

const gasEstimate = 350_000
const args = [ name, factory, quoter, gasEstimate ]

module.exports = deployAdapter(networkName, tags, name, contractName, args)
