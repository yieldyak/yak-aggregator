const { deployAdapter, addresses } = require('../../../utils')
const { twostable } = addresses.arbitrum.curve

const networkName = 'arbitrum'
const tags = [ 'curve', '2pool', 'twostable' ]
const name = 'Curve2stableAdapter'
const contractName = 'CurvePlain128Adapter'

const gasEstimate = 260_000
const pool = twostable
const args = [ name, pool, gasEstimate ]

module.exports = deployAdapter(networkName, tags, name, contractName, args)