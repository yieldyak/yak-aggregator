const { deployUniV2Contract, addresses } = require('../../../utils')
const { unilikeFactories } = addresses.avalanche

const factory = unilikeFactories.joe
const networkName = 'avalanche'
const name = 'TraderjoeAdapter'
const tags = [ 'traderjoe' ]
const fee = 3

module.exports = deployUniV2Contract(networkName, tags, name, factory, fee)