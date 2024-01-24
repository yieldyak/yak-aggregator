const { deployAdapter, addresses } = require('../../../utils')
const { crvusd_frax } = addresses.arbitrum.curve

const networkName = 'arbitrum'
const tags = [ 'curve', 'crvusd_frax']
const name = 'Curve2crvUsdFrax'
const contractName = 'CurvePlain128Adapter'

const gasEstimate = 320_000
const pool = crvusd_frax
const args = [ name, pool, gasEstimate ]

module.exports = deployAdapter(networkName, tags, name, contractName, args)