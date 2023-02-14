const { deployAdapter, addresses } = require('../../../utils')
const { tripool } = addresses.optimism.curve.plain128

const networkName = 'optimism'
const tags = [ 'curve', 'tripool' ]
const name = 'Curve3stableAdapter'
const contractName = 'CurvePlain128Adapter'

const gasEstimate = 260_000
const pool = tripool
const args = [ name, pool, gasEstimate ]

module.exports = deployAdapter(networkName, tags, name, contractName, args)