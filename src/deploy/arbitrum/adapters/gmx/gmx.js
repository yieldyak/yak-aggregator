const { deployAdapter, addresses } = require('../../../utils')
const { vault } = addresses.arbitrum.gmx

const networkName = 'arbitrum'
const tags = [ 'gmx' ]
const name = 'GmxAdapter'
const contractName = 'GmxAdapter'

const gasEstimate = 630_000
const args = [ name, vault, gasEstimate ]

module.exports = deployAdapter(networkName, tags, name, contractName, args)