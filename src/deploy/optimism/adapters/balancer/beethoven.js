const { deployAdapter, addresses } = require('../../../utils')
const beethovenx = addresses.optimism.beethovenx

const networkName = 'optimism'
const tags = [ 'beethovenx' ]
const name = 'BeethovenxAdapter'
const contractName = 'BalancerV2Adapter'

const gasEstimate = 280_000
const args = [
    name,
    beethovenx.vault,
    Object.values(beethovenx.pools),
    gasEstimate
]

module.exports = deployAdapter(networkName, tags, name, contractName, args)