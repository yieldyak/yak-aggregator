const { deployAdapter, addresses } = require('../../../utils')
const { frax_bp } = addresses.arbitrum.curve

const networkName = 'arbitrum'
const tags = [ 'curve', 'frax_bp' ]
const name = 'CurveFraxBpAdapter'
const contractName = 'CurvePlain128Adapter'

const gasEstimate = 660_000
const pool = frax_bp
const args = [ name, pool, gasEstimate ]

module.exports = deployAdapter(networkName, tags, name, contractName, args)