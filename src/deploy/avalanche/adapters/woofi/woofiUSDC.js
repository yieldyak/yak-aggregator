const { deployAdapter, addresses } = require('../../../utils')
const { WoofiPoolUSDC } = addresses.avalanche.other

const networkName = 'avalanche'
const tags = [ 'woofi' ]
const name = 'WoofiUSDCAdapter'
const contractName = 'WoofiAdapter'

const gasEstimate = 525_000
const pool = WoofiPoolUSDC
const args = [ name, gasEstimate, pool, ]

module.exports = deployAdapter(networkName, tags, name, contractName, args)