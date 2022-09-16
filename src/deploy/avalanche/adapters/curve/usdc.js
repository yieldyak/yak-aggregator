const { deployAdapter, addresses } = require('../../../utils')
const { CurveUSDC } = addresses.avalanche.curvelikePools

const networkName = 'avalanche'
const tags = [ 'curve', 'curveUsdc' ]
const name = 'CurveUSDCAdapter'
const contractName = 'CurvePlain128Adapter'

const pool = CurveUSDC
const gasEstimate = 240_000
const args = [ name, pool, gasEstimate ]

module.exports = deployAdapter(networkName, tags, name, contractName, args)