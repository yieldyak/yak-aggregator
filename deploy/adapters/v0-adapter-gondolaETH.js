module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments
  const { deployer } = await getNamedAccounts()

  const NAME = 'GondolaETHYakAdapterV0'
  const POOL = '0xed986f982269e0319F710EC270875dE2b2A443d2' // GondolaETH pool
  const GAS_ESTIMATE = 280000

  log(`GondolaETHYakAdapterV0`)
  const deployResult = await deploy('GondolaETHYakAdapterV0', {
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

module.exports.tags = ['V0', 'adapter', 'gondolaETH']
