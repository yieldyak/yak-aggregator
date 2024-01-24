const { deployAdapter, addresses } = require('../../../utils')
const { crvusd_usdt } = addresses.arbitrum.curve

const networkName = 'arbitrum'
const tags = [ 'curve', 'crvusd_usdt']
const name = 'Curve2crvUsdUsdt'
const contractName = 'CurvePlain128Adapter'

const gasEstimate = 320_000
const pool = crvusd_usdt
const args = [ name, pool, gasEstimate ]

module.exports = deployAdapter(networkName, tags, name, contractName, args)