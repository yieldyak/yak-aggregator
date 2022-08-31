module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const { unilikeFactories } = require("../../../../misc/addresses.json").avalanche

    const NAME = 'ElkYakAdapterV0'
    const FACTORY = unilikeFactories.elk
    const FEE = 3
    const GAS_ESTIMATE = 120000

    log(`ElkYakAdapterV0`)
    const deployResult = await deploy("ElkYakAdapterV0", {
      from: deployer,
      contract: "UnilswapV2Adapter",
      gas: 4000000,
      args: [
          NAME,
          FACTORY,
          FEE,
          GAS_ESTIMATE
      ],
      skipIfAlreadyDeployed: true
    })
  
    if (deployResult.newlyDeployed) {
      log(`- ${deployResult.contractName} deployed at ${deployResult.address} using ${deployResult.receipt.gasUsed} gas`)
    } else {
      log(`- Deployment skipped, using previous deployment at: ${deployResult.address}`)
    }
  }

  module.exports.tags = ['V0', 'adapter', 'elk', 'avalanche']