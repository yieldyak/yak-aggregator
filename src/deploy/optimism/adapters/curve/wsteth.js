const { deployAdapter, addresses } = require('../../../utils')
const { wsteth_eth } = addresses.optimism.curve.plain128_native

const networkName = 'optimism'
const tags = [ 'curve', 'wsteth' ]
const name = 'CurveWstethAdapter'
const contractName = 'CurvePlain128NativeAdapter'

const gasEstimate = 260_000
const pool = wsteth_eth
const args = [ name, gasEstimate, pool, addresses.optimism.assets.WETH ]

module.exports = deployAdapter(networkName, tags, name, contractName, args)