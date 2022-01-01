module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments
  const { deployer } = await getNamedAccounts()

  const NAME = 'GondolaUSDTYakAdapterV0'
  const POOL = '0x753E5e78e3B16DE7F3C415D2bF685808348831a9' // GondolaUSDT pool
  const GAS_ESTIMATE = 280000

  log(`V0)GondolaUSDTYakAdapterV0`)
  const deployResult = await deploy('GondolaUSDTYakAdapterV0', {
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

module.exports.tags = ['V0', 'adapter', 'gondolaUSDT']
