const { deployWrapper, addresses } = require('../../utils')
const { GmxRewardRouter } = addresses.avalanche.other
const { GLP, sGLP } = addresses.avalanche.assets

const networkName = 'avalanche'
const tags = [ 'gmx' ]
const name = 'GlpWrapper'
const contractName = 'GlpWrapper'

const gasEstimate = 1_600_000
const rewardRouter = GmxRewardRouter
const args = [ name, gasEstimate, rewardRouter, GLP, sGLP ]

module.exports = deployWrapper(networkName, tags, name, contractName, args)