const { deployAdapter, addresses } = require('../../../utils')
const { CurveMore, CurveAave } = addresses.avalanche.curvelikePools
const { curveMetaSwapper } = addresses.avalanche.other

const networkName = 'avalanche'
const tags = [ 'curve', 'curveMore' ]
const name = 'CurveMoreAdapter'
const contractName = 'CurveMetaWithSwapperAdapter'

const metaPool = CurveMore
const basePool = CurveAave
const swapper = curveMetaSwapper
const gasEstimate = 1_100_000
const args = [ name, gasEstimate, metaPool, basePool, swapper ]

module.exports = deployAdapter(networkName, tags, name, contractName, args)