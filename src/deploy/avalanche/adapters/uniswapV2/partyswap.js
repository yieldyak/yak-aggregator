module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments
  const { deployer } = await getNamedAccounts()
  const { unilikeFactories } = require("../../../../misc/addresses.json").avalanche

  const NAME = 'PartyswapAdapterV0'
  const FACTORY = unilikeFactories.partyswap
  const FEE = 3
  const GAS_ESTIMATE = 120000

  log(NAME)
  const deployResult = await deploy(NAME, {
    from: deployer,
    contract: "UniswapV2Adapter",
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
      log(`- ${deployResult.contractName} deployed at ${deployResult.address} using ${deployResult.receipt.gasUsed} gas`);
    } else {
      log(`- Deployment skipped, using previous deployment at: ${deployResult.address}`)
    }
  };

  module.exports.tags = ['V0', 'adapter', 'partyswap', 'avalanche'];