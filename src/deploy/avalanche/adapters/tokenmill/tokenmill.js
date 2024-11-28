const { deployAdapter, addresses } = require('../../../utils')
const { other } = addresses.avalanche

const networkName = 'avalanche'
const contractName = 'TokenMillAdapter'
const name = 'TokenMillAdapter'
const tags = [ 'tokenmill' ]

const gasEstimate = 190_000;
const factory = other.TokenMillFactory
const args = [name,factory, gasEstimate ];

module.exports = deployAdapter(networkName, tags, name, contractName, args)