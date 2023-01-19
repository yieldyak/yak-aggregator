const { deployAdapter, addresses } = require('../../../utils')
const { vst_frax } = addresses.arbitrum.curve

const networkName = 'arbitrum'
const tags = [ 'curve', 'vst_frax' ]
const name = 'CurveFraxVstAdapter'
const contractName = 'CurvePlain128Adapter'

const gasEstimate = 660_000
const pool = vst_frax
const args = [ name, pool, gasEstimate ]

module.exports = deployAdapter(networkName, tags, name, contractName, args)