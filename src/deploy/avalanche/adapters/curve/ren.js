const { deployAdapter, addresses } = require('../../../utils')
const { CurveRen } = addresses.avalanche.curvelikePools

const networkName = 'avalanche'
const tags = [ 'curve', 'curveRen' ]
const name = 'CurveRenAdapter'
const contractName = 'Curve2Adapter'

const pool = CurveRen
const gasEstimate = 500_000
const args = [ name, pool, gasEstimate ]

module.exports = deployAdapter(networkName, tags, name, contractName, args)