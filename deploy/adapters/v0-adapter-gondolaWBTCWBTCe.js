module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments
  const { deployer } = await getNamedAccounts()

  const NAME = 'GondolaWBTCWBTCeYakAdapterV0'
  const POOL = '0x0792ca636c917177AB534BD2D86aDa5535D97369' // Gondola WBTC-WBTC.e pool
  const GAS_ESTIMATE = 280000

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

module.exports.tags = ['V0', 'adapter', 'gondolaWBTCWBTCe']
