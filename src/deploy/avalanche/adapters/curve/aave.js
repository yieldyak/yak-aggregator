const { deployAdapter, addresses } = require('../../../utils')
const { CurveAave } = addresses.avalanche.curvelikePools

const networkName = 'avalanche'
const tags = [ 'curve', 'curveAave' ]
const name = 'CurveAaveAdapter'
const contractName = 'Curve2Adapter'

const gasEstimate = 770_000
const pool = CurveAave
const args = [ name, pool, gasEstimate ]

module.exports = deployAdapter(networkName, tags, name, contractName, args)