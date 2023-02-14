const { deployAdapter, addresses } = require('../../../utils')
const { susd_meta_fraxbp } = addresses.optimism.saddle

const networkName = 'optimism'
const tags = [ 'saddle', 'susd_meta_fraxbp' ]
const name = 'SaddleMetaSUSDAdapter'
const contractName = 'SaddleMetaAdapter'

const gasEstimate = 625_000
const pool = susd_meta_fraxbp
const args = [ name, pool, gasEstimate ]

module.exports = deployAdapter(networkName, tags, name, contractName, args)