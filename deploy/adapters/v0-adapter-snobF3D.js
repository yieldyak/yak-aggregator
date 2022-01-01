module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments
  const { deployer } = await getNamedAccounts()

  const NAME = 'SnobF3YakAdapterV0'
  const POOL = '0x05c5DB43dB72b6E73702EEB1e5b62A03a343732a' // SnobF3 pool
  const GAS_ESTIMATE = 300000

  log(`SnobF3YakAdapterV0`)
  const deployResult = await deploy('SnobF3YakAdapterV0', {
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
