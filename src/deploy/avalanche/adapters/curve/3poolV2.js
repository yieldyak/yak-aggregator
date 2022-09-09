const { deployAdapter, addresses } = require('../../../utils')
const { Curve3poolV2 } = addresses.avalanche.curvelikePools

const networkName = 'avalanche'
const tags = [ 'curve', 'curve3poolV2' ]
const name = 'Curve3poolV2Adapter'
const contractName = 'CurvePlain128Adapter'

const gasEstimate = 250_000
const pool = Curve3poolV2
const args = [ name, pool, gasEstimate ]

module.exports = deployAdapter(networkName, tags, name, contractName, args)