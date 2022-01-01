module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments
  const { deployer } = await getNamedAccounts()

  const NAME = 'GondolaDAIDAIeYakAdapterV0'
  const POOL = '0x159E2fE53E415B163bC5846DD70DDD2BC8d8F018' // Gondola DAI-DAI.e pool
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

module.exports.tags = ['V0', 'adapter', 'gondolaDAIDAIe']
