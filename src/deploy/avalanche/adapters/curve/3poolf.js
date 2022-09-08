const { deployAdapter, addresses } = require('../../../utils')
const { Curve3poolf } = addresses.avalanche.curvelikePools

const networkName = 'avalanche'
const tags = [ 'curve', 'curve3poolf' ]
const name = 'Curve3poolfAdapter'
const contractName = 'CurvePlain128Adapter'

const gasEstimate = 250_000
const pool = Curve3poolf
const args = [ name, pool, gasEstimate ]

module.exports = deployAdapter(networkName, tags, name, contractName, args)