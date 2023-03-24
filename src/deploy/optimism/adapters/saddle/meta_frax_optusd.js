const { deployAdapter, addresses } = require('../../../utils')
const { frax_meta_optusd } = addresses.optimism.saddle

const networkName = 'optimism'
const tags = [ 'saddle', 'frax_meta_optusd' ]
const name = 'SaddleMetaFraxAdapter'
const contractName = 'SaddleMetaAdapter'

const gasEstimate = 625_000
const pool = frax_meta_optusd
const args = [ name, pool, gasEstimate ]

module.exports = deployAdapter(networkName, tags, name, contractName, args)