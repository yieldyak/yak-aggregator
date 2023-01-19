const { deployAdapter, addresses } = require('../../../utils')
const { tricrypto } = addresses.arbitrum.curve

const networkName = 'arbitrum'
const tags = [ 'curve', '3crypto', 'tricrypto' ]
const name = 'Curve3cryptoAdapter'
const contractName = 'CurvePlain256Adapter'

const gasEstimate = 660_000
const pool = tricrypto
const args = [ name, pool, gasEstimate ]

module.exports = deployAdapter(networkName, tags, name, contractName, args)