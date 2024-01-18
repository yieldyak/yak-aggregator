const { deployAdapter, addresses } = require('../../../utils')
const { factory, quoter } = addresses.mantle.agni

const networkName = 'mantle'
const contractName = 'AgniAdapter'
const tags = [ 'agni' ]
const name = contractName
const gasEstimate = 300_000
const quoterGasLimit = gasEstimate - 60_000
const defaultFees = [100, 500, 2_500, 10_000]
const args = [ name, gasEstimate, quoterGasLimit, quoter, factory, defaultFees ]

module.exports = deployAdapter(networkName, tags, contractName, contractName, args)