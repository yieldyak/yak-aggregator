const { deployAdapter, addresses } = require('../../../utils')
const { SynapseDAIeUSDCeUSDTeNUSD } = addresses.avalanche.curvelikePools

const networkName = 'avalanche'
const tags = [ 'synapse' ]
const name = 'SynapseAdapter'
const contractName = 'SaddleAdapter'

const gasEstimate = 320_000
const pool = SynapseDAIeUSDCeUSDTeNUSD
const args = [ name, pool, gasEstimate, ]

module.exports = deployAdapter(networkName, tags, name, contractName, args)