const { deployAdapter, addresses } = require('../../../utils')
const { kyberPools } = addresses.avalanche

const networkName = 'avalanche'
const tags = [ 'kyber' ]
const name = 'KyberAdapter'
const contractName = 'KyberAdapter'

const gasEstimate = 182_000
const pools = [ kyberPools.USDTeUSDCe ]
const args = [ name, pools, gasEstimate ]

module.exports = deployAdapter(networkName, tags, name, contractName, args)