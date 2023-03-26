const { deployAdapter, addresses } = require('../../utils')
const { WETH } = addresses.arbitrum.assets

const networkName = 'arbitrum'
const tags = [ 'weth' ]
const name = 'WETHAdapter'
const contractName = 'WNativeAdapter'

const gasEstimate = 80_000
const wnative = WETH
const args = [ wnative, gasEstimate ]

module.exports = deployAdapter(networkName, tags, name, contractName, args)