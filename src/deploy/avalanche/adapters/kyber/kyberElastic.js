const { deployAdapter, addresses } = require('../../../utils')
const { kyberElastic } = addresses.avalanche

const networkName = 'avalanche'
const tags = [ 'kyberElastic' ]
const name = 'KyberElasticAdapter'
const contractName = 'KyberElasticAdapter'

const gasEstimate = 200_000
const pools = Object.values(kyberElastic.pools)
const args = [ name, gasEstimate, kyberElastic.quoter, pools ]

module.exports = deployAdapter(networkName, tags, name, contractName, args)