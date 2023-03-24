const { deployAdapter, addresses } = require('../../../utils')
const { meta_arbusdV2 } = addresses.arbitrum.saddle

const networkName = 'arbitrum'
const tags = [ 'saddle', 'meta_arbusdV2' ]
const name = 'SaddleMetaArbUsdV2Adapter'
const contractName = 'SaddleMetaAdapter'

const gasEstimate = 625_000
const pool = meta_arbusdV2
const args = [ name, pool, gasEstimate ]

module.exports = deployAdapter(networkName, tags, name, contractName, args)