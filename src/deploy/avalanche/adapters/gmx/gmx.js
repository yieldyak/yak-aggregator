const { deployAdapter, addresses } = require('../../../utils')
const { GmxVault } = addresses.avalanche.other

const networkName = 'avalanche'
const tags = [ 'gmx' ]
const name = 'GmxAdapter'
const contractName = 'GmxAdapter'

const gasEstimate = 630_000
const vault = GmxVault
const args = [ name, vault, gasEstimate ]

module.exports = deployAdapter(networkName, tags, name, contractName, args)