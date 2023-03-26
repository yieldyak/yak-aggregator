const { deployAdapter, addresses } = require('../../../utils')
const { frax_usdc_bp } = addresses.optimism.saddle

const networkName = 'optimism'
const tags = [ 'saddle', 'frax_usdc_bp' ]
const name = 'SaddleFraxBPAdapter'
const contractName = 'SaddleAdapter'

const gasEstimate = 310_000
const pool = frax_usdc_bp
const args = [ name, pool, gasEstimate ]

module.exports = deployAdapter(networkName, tags, name, contractName, args)