const { deployAdapter, addresses } = require('../../../utils')
const { kyberElastic } = addresses.arbitrum

const networkName = 'arbitrum'
const tags = [ 'kyberElastic' ]
const name = 'KyberElasticAdapter'
const contractName = 'KyberElasticAdapter'

const gasEstimate = 210_000
const quoterGasLimit = gasEstimate
const pools = Object.values(kyberElastic.pools)
const args = [ name, gasEstimate, quoterGasLimit, kyberElastic.quoter, pools ]

module.exports = deployAdapter(networkName, tags, name, contractName, args)