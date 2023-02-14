const { deployAdapter, addresses } = require('../../../utils')
const { opt_usd } = addresses.optimism.saddle

const networkName = 'optimism'
const tags = [ 'saddle', 'optusd' ]
const name = 'SaddleOptUsdAdapter'
const contractName = 'SaddleAdapter'

const gasEstimate = 330_000
const pool = opt_usd
const args = [ name, pool, gasEstimate ]

module.exports = deployAdapter(networkName, tags, name, contractName, args)