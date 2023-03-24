const { deployAdapter, addresses } = require('../../../utils')
const { helper, pools } = addresses.arbitrum.dodo.v1

const networkName = 'arbitrum'
const tags = [ 'dodov1' ]
const name = 'DodoV1Adapter'
const contractName = 'DodoV1Adapter'

const gasEstimate = 335_000
const args = [ name, Object.values(pools), helper, gasEstimate ]

module.exports = deployAdapter(networkName, tags, name, contractName, args)