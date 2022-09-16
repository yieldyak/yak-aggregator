const { deployAdapter, addresses } = require('../../../utils')
const { AxialAS4D } = addresses.avalanche.curvelikePools

const networkName = 'avalanche'
const tags = [ 'axial', 'axialAS4D' ]
const name = 'AxialAS4DAdapter'
const contractName = 'SaddleAdapter'

const gasEstimate = 330_000
const pool = AxialAS4D
const args = [ name, pool, gasEstimate ]

module.exports = deployAdapter(networkName, tags, name, contractName, args)