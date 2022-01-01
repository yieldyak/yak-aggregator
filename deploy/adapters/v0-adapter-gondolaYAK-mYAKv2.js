const { curvelikePools } = require('../../test/addresses.json')

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments
  const { deployer } = await getNamedAccounts()

  const NAME = 'GondolaYAKmYAKv2AdapterV0'
  const POOL = curvelikePools.GondolaYAKmYAKv2
  const GAS_ESTIMATE = 110000

  log(NAME)
  const deployResult = await deploy(NAME, {
    from: deployer,
    contract: 'CurveLikeAdapter',
    gas: 4000000,
    args: [NAME, POOL, GAS_ESTIMATE],
    skipIfAlreadyDeployed: true,
  })

  if (deployResult.newlyDeployed) {
    log(`- ${deployResult.contractName} deployed at ${deployResult.address} using ${deployResult.receipt.gasUsed} gas`)
  } else {
    log(`- Deployment skipped, using previous deployment at: ${deployResult.address}`)
  }
}

module.exports.tags = ['V0', 'adapter', 'gondolaYAKmYAKv2']
