const { deployAdapter, addresses } = require('../../../utils')
const { crvusd_usdce } = addresses.arbitrum.curve

const networkName = 'arbitrum'
const tags = [ 'curve', 'crvusd_usdce']
const name = 'Curve2crvUsdUsdce'
const contractName = 'CurvePlain128Adapter'

const gasEstimate = 320_000
const pool = crvusd_usdce
const args = [ name, pool, gasEstimate ]

module.exports = deployAdapter(networkName, tags, name, contractName, args)