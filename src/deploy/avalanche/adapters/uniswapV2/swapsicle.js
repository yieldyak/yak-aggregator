const { deployUniV2Contract, addresses } = require('../../../utils')
const { unilikeFactories } = addresses.avalanche

const factory = unilikeFactories.swapsicle
const networkName = 'avalanche'
const name = 'SwapsicleAdapter'
const tags = [ 'swapsicle' ]
const fee = 3

module.exports = deployUniV2Contract(networkName, tags, name, factory, fee)