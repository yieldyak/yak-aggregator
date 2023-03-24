const { deployAdapter, addresses } = require('../../../utils')
const { arbusd } = addresses.arbitrum.saddle

const networkName = 'arbitrum'
const tags = [ 'saddle', 'arbusd' ]
const name = 'SaddleArbUsdAdapter'
const contractName = 'SaddleAdapter'

const gasEstimate = 330_000
const pool = arbusd
const args = [ name, pool, gasEstimate ]

module.exports = deployAdapter(networkName, tags, name, contractName, args)