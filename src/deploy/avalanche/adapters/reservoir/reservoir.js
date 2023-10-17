const { deployAdapter, addresses } = require('../../../utils')
const { reservoir } = addresses.reservoir

const networkName = 'avalanche'
const tags = [ 'reservoir', 'stableswap' ]
const name = 'ReservoirAdapter'
const contractName = 'ReservoirAdapter'
const factory = reservoir.factory
const quoter = reservoir.quoter

const gasEstimate = 350_000
const args = [ name, factory, quoter, gasEstimate ]

module.exports = deployAdapter(networkName, tags, name, contractName, args)
