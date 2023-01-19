const { deployAdapter, addresses } = require('../../../utils')
const { pools } = addresses.arbitrum.dodo.v2

const networkName = 'arbitrum'
const tags = [ 'dodov2' ]
const name = 'DodoV2Adapter'
const contractName = 'DodoV2Adapter'

const gasEstimate = 290_000
const args = [ name, Object.values(pools), gasEstimate ]

module.exports = deployAdapter(networkName, tags, name, contractName, args)