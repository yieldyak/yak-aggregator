const { deployAdapter, addresses } = require('../../../utils')
const { seth_eth } = addresses.optimism.curve.plain128_native

const networkName = 'optimism'
const tags = [ 'curve', 'seth' ]
const name = 'CurveSethAdapter'
const contractName = 'CurvePlain128NativeAdapter'

const gasEstimate = 260_000
const pool = seth_eth
const args = [ name, gasEstimate, pool, addresses.optimism.assets.WETH ]

module.exports = deployAdapter(networkName, tags, name, contractName, args)