const { deployAdapter, addresses } = require('../../../utils')
const { susd_3crv } = addresses.optimism.curve.metav2

const networkName = 'optimism'
const tags = [ 'curve', 'meta' ]
const name = 'CurveMetaSUSDCRVAdapter'
const contractName = 'CurveMetaV2Adapter'

const gasEstimate = 480_000
const pool = susd_3crv
const args = [ name, pool, gasEstimate ]

module.exports = deployAdapter(networkName, tags, name, contractName, args)