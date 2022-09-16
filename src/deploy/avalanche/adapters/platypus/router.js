const { deployAdapter, addresses } = require('../../../utils')
const { platypus } = addresses.avalanche

const networkName = 'avalanche'
const tags = [ 'platypus' ]
const name = 'PlatypusAdapter'
const contractName = 'PlatypusAdapter'

const gasEstimate = 470_000
const pools = [
  platypus.main, 
  platypus.frax,
  platypus.mim,
  platypus.savax,
  platypus.btc,
  platypus.yusd,
  platypus.h20,
  platypus.money,
  platypus.tsd,  
]
const args = [ name, gasEstimate, pools ]

module.exports = deployAdapter(networkName, tags, name, contractName, args)