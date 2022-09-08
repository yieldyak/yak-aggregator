const { deployAdapter, addresses } = require('../../../utils')
const { ArableSF } = addresses.avalanche.other

const networkName = 'avalanche'
const tags = [ 'arable' ]
const name = 'ArableAdapter'
const contractName = 'ArableSFAdapter'

const gasEstimate = 235_000
const vault = ArableSF
const args = [ name, vault, gasEstimate ]

module.exports = deployAdapter(networkName, tags, name, contractName, args)