const { deployWrapper, addresses } = require('../../utils')
const { GmxRewardRouter } = addresses.avalanche.other

const networkName = 'avalanche'
const tags = [ 'gmx' ]
const name = 'GlpWrapper'
const contractName = 'GlpWrapper'

const gasEstimate = 1_100_000
const rewardRouter = GmxRewardRouter
const args = [ name, gasEstimate, rewardRouter ]

module.exports = deployWrapper(networkName, tags, name, contractName, args)