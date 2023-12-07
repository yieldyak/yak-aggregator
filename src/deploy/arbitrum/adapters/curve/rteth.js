const { deployAdapter, addresses } = require('../../../utils')
const { rteth } = addresses.arbitrum.curve

const networkName = 'arbitrum'
const tags = [ 'curve', 'rteth' ]
const name = 'CurveRtEthAdapter'
const contractName = 'CurvePlain128Adapter'

const gasEstimate = 660_000
const pool = rteth
const args = [ name, pool, gasEstimate ]

module.exports = deployAdapter(networkName, tags, name, contractName, args)