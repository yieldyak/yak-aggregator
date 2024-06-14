const { deployUniV2Contract, addresses } = require('../../../utils')
const { uniswapv2 } = addresses.holesky.univ2Factories

const networkName = 'holesky'
const name = 'UniswapV2Adapter'
const tags = [ 'uniswapv2' ]
const factory = uniswapv2
const fee = 3

module.exports = deployUniV2Contract(networkName, tags, name, factory, fee)