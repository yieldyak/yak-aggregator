const { deployAdapter, addresses } = require('../../utils')
const { WMNT } = addresses.mantle.assets

const networkName = 'mantle'
const tags = [ 'wmnt' ]
const name = 'WMNTAdapter'
const contractName = 'WNativeAdapter'

const gasEstimate = 80_000
const wnative = WMNT
const args = [ wnative, gasEstimate ]

module.exports = deployAdapter(networkName, tags, name, contractName, args)