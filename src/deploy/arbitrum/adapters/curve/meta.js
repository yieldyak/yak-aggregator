const { deployAdapter, addresses } = require('../../../utils')
const { meta_mim } = addresses.arbitrum.curve

const networkName = 'arbitrum'
const tags = [ 'curve', 'meta' ]
const name = 'CurveMetaAdapter'
const contractName = 'CurveMetaV3Adapter'

const gasEstimate = 480_000
const pools = [ meta_mim ]
const args = [ name, pools, gasEstimate ]

module.exports = deployAdapter(networkName, tags, name, contractName, args)