const { deployAdapter, addresses } = require('../../../utils')
const { qbook } = addresses.avalanche

const networkName = 'avalanche'
const tags = [ 'qbookv1' ]
const name = 'QBookV1Adapter'
const contractName = 'QBookAdapter'

const gasEstimate = 240_000
const router = qbook.router
const args = [ name, gasEstimate, router ]

module.exports = deployAdapter(networkName, tags, name, contractName, args)