const { deployAdapter, addresses } = require('../../../utils')
const balancerV2 = addresses.arbitrum.balancerV2

const networkName = 'arbitrum'
const tags = [ 'balancerV2' ]
const name = 'BalancerV2Adapter'
const contractName = 'BalancerV2Adapter'

const gasEstimate = 280_000
const args = [
    name,
    balancerV2.vault,
    Object.values(balancerV2.pools),
    gasEstimate
]

module.exports = deployAdapter(networkName, tags, name, contractName, args)