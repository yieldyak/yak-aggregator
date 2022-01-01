module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments
  const { deployer } = await getNamedAccounts()

  const NAME = 'SnobS3YakAdapterV0'
  const POOL = '0x6B41E5c07F2d382B921DE5C34ce8E2057d84C042' // SnobS3 pool
  const GAS_ESTIMATE = 300000

  log(`SnobS3YakAdapterV0`)
  const deployResult = await deploy('SnobS3YakAdapterV0', {
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

module.exports.tags = ['V0', 'adapter', 'snobS3']
