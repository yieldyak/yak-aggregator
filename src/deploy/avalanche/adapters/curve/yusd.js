const { deployAdapter, addresses } = require('../../../utils')
const { CurveYUSD } = addresses.avalanche.curvelikePools

const networkName = 'avalanche'
const tags = [ 'curve', 'curveYUSD' ]
const name = 'CurveYUSDAdapter'
const contractName = 'CurvePlain128Adapter'

const pool = CurveYUSD
const gasEstimate = 280_000
const args = [ name, pool, gasEstimate ]

module.exports = deployAdapter(networkName, tags, name, contractName, args)