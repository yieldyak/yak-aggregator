const { deployAdapter, addresses } = require('../../../utils')
const { factory } = addresses.arbitrum.swapr

const networkName = 'arbitrum'
const name = 'SwaprAdapter'
const contractName = 'DxSwapAdapter'
const tags = [ 'swapr', 'dxswap' ]
const gasEstimate = 180_000
const args = [ name,  factory,  gasEstimate ]

module.exports = deployAdapter(networkName, tags, name, contractName, args)
