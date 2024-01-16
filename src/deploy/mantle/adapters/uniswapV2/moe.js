const { deployUniV2Contract, addresses } = require('../../../utils')
const { unilikeFactories } = addresses.mantle

const factory = unilikeFactories.moe
const networkName = 'mantle'
const name = 'MerchantMoeAdapter'
const tags = [ 'moe' ]
const fee = 3

module.exports = deployUniV2Contract(networkName, tags, name, factory, fee)