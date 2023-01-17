const { deployAdapter, addresses } = require('../../../utils')
const { WoofiV2Pool } = addresses.avalanche.other

const networkName = 'avalanche'
const tags = [ 'woofiV2' ]
const name = 'WoofiV2Adapter'
const contractName = 'WoofiV2Adapter'

const gasEstimate = 410_000
const pool = WoofiV2Pool
const args = [ name, gasEstimate, pool, ]

module.exports = deployAdapter(networkName, tags, name, contractName, args)