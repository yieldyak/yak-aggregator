const { deployUniV2Contract, addresses } = require('../../../utils')
const { unilikeFactories } = addresses.avalanche

const factory = unilikeFactories.hakuswap
const networkName = 'avalanche'
const name = 'HakuswapAdapter'
const tags = [ 'hakuswap' ]
const fee = 2

module.exports = deployUniV2Contract(networkName, tags, name, factory, fee)