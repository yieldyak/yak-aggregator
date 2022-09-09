const { deployUniV2Contract, addresses } = require('../../../utils')
const { unilikeFactories } = addresses.avalanche

const factory = unilikeFactories.pangolin
const networkName = 'avalanche'
const name = 'PangolinAdapter'
const tags = [ 'pangolin' ]
const fee = 3

module.exports = deployUniV2Contract(networkName, tags, name, factory, fee)