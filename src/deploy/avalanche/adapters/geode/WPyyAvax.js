const { deployAdapter, addresses, constants } = require('../../../utils')
const { GeodePortal } = addresses.avalanche.other
const { yyPlanet } = constants.geode

const networkName = 'avalanche'
const tags = [ 'geode' ]
const name = 'GeodeWPAdapter'
const contractName = 'GeodeWPAdapter'

const gasEstimate = 340_000
const portal = GeodePortal
const planetId = yyPlanet
const args = [ name, portal, planetId, gasEstimate ]

module.exports = deployAdapter(networkName, tags, name, contractName, args)