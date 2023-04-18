const { deployAdapter, addresses } = require('../../../utils')
const { SolisnekFactory: factory } = addresses.avalanche.other

const networkName = 'avalanche'
const tags = [ 'solisnek' ]
const name = 'SolisnekAdapter'
const contractName = 'VelodromeAdapter'

const gasEstimate = 400_000
const args = [ name, factory, gasEstimate ]

module.exports = deployAdapter(networkName, tags, name, contractName, args)