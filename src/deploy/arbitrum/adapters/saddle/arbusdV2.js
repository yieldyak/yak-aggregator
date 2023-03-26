const { deployAdapter, addresses } = require('../../../utils')
const { arbusdV2 } = addresses.arbitrum.saddle

const networkName = 'arbitrum'
const tags = [ 'saddle', 'arbusdV2' ]
const name = 'SaddleArbUsdV2Adapter'
const contractName = 'SaddleAdapter'

const gasEstimate = 310_000
const pool = arbusdV2
const args = [ name, pool, gasEstimate ]

module.exports = deployAdapter(networkName, tags, name, contractName, args)