const { deployAdapter, addresses } = require('../../../utils')
const { CurveAtricrypto } = addresses.avalanche.curvelikePools

const networkName = 'avalanche'
const tags = [ 'curve', 'curveAtricrypto' ]
const name = 'CurveAtricryptoAdapter'
const contractName = 'Curve1Adapter'

const gasEstimate = 1_500_000
const pool = CurveAtricrypto
const args = [ name, pool, gasEstimate ]

module.exports = deployAdapter(networkName, tags, name, contractName, args)