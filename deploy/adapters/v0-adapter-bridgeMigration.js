module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments
  const { deployer } = await getNamedAccounts()
  const { assets } = require('../../test/addresses.json')

  const NEW_TKNS = [
    assets.WETHe,
    assets.WBTCe,
    assets.DAIe,
    assets.USDTe,
    assets.LINKe,
    assets.UNIe,
    assets.SUSHIe,
    assets.BUSDe,
  ]
  const OLD_TKNS = [
    assets.ETH,
    assets.WBTC,
    assets.DAI,
    assets.USDT,
    assets.LINK,
    assets.UNI,
    assets.SUSHI,
    assets.BUSD,
  ]
  const GAS_ESTIMATE = 9e4

  log(`BridgeMigrationAdapterV0`)
  const deployResult = await deploy('BridgeMigrationAdapterV0', {
    from: deployer,
    contract: 'BridgeMigrationAdapter',
    gas: 4000000,
    args: [NEW_TKNS, OLD_TKNS, GAS_ESTIMATE],
    skipIfAlreadyDeployed: true,
  })

  if (deployResult.newlyDeployed) {
    log(`- ${deployResult.contractName} deployed at ${deployResult.address} using ${deployResult.receipt.gasUsed} gas`)
  } else {
    log(`- Deployment skipped, using previous deployment at: ${deployResult.address}`)
  }
}

module.exports.tags = ['V0', 'adapter', 'bridgeMigration']
