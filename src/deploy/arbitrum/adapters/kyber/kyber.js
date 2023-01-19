const { deployAdapter, addresses } = require('../../../utils')
const { kyberPools } = addresses.arbitrum

const networkName = 'arbitrum'
const tags = [ 'kyber' ]
const name = 'KyberAdapter'
const contractName = 'KyberAdapter'

const gasEstimate = 182_000
const pools = [ kyberPools.mai_usdc ]
const args = [ name, pools, gasEstimate ]

module.exports = deployAdapter(networkName, tags, name, contractName, args)