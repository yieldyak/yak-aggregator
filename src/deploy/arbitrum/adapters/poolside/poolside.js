const {deployAdapter, addresses} = require('../../../utils')
const {ButtonTokenFactory, PoolsideV1Factory} = addresses.arbitrum.other

const networkName = 'arbitrum'
const tags = ['poolside']
const name = 'PoolsideV1Adapter'
const contractName = 'PoolsideV1Adapter'

const gasEstimate = 415_000
const _buttonswapFactory = PoolsideV1Factory
const _buttonTokenFactory = ButtonTokenFactory
const args = [name, _buttonswapFactory, _buttonTokenFactory, gasEstimate]

module.exports = deployAdapter(networkName, tags, name, contractName, args)
