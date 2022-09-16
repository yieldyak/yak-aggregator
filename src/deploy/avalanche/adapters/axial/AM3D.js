const { deployAdapter, addresses } = require('../../../utils')
const { AxialAM3D } = addresses.avalanche.curvelikePools

const networkName = 'avalanche'
const tags = [ 'axial', 'axialAM3D' ]
const name = 'AxialAM3DAdapter'
const contractName = 'SaddleAdapter'

const gasEstimate = 320_000
const pool = AxialAM3D
const args = [ name, pool, gasEstimate ]

module.exports = deployAdapter(networkName, tags, name, contractName, args)