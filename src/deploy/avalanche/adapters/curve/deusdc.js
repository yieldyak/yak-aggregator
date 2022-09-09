const { deployAdapter, addresses } = require('../../../utils')
const { CurveDeUSDC, CurveAave } = addresses.avalanche.curvelikePools
const { curveMetaSwapper } = addresses.avalanche.other

const networkName = 'avalanche'
const tags = [ 'curve', 'curveDeUSDC' ]
const name = 'CurveDeUSDCAdapter'
const contractName = 'CurveMetaWithSwapperAdapter'

const metaPool = CurveDeUSDC
const basePool = CurveAave
const swapper = curveMetaSwapper
const gasEstimate = 1_100_000
const args = [ name, gasEstimate, metaPool, basePool, swapper ]

module.exports = deployAdapter(networkName, tags, name, contractName, args)