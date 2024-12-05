const { deployAdapter, addresses } = require('../../../utils')
const { other } = addresses.avalanche

const networkName = 'avalanche'
const contractName = 'TokenMillAdapter'
const name = 'TokenMillAdapter'
const referrer = '0xDcEDF06Fd33E1D7b6eb4b309f779a0e9D3172e44'
const tags = [ 'tokenmill' ]

const gasEstimate = 210_000;
const factory = other.TokenMillFactory
const args = [name,factory, referrer, gasEstimate ];

module.exports = deployAdapter(networkName, tags, name, contractName, args)