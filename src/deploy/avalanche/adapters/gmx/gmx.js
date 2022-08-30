module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();
    const { other } = require('../../../../test/addresses.json')

    const NAME = 'GmxAdapterV0'
    const VAULT = other.GmxVault
    const GAS_ESTIMATE = 6.32e5

    log(NAME)
    const deployResult = await deploy(NAME, {
      from: deployer,
      contract: "GmxAdapter",
      gas: 4000000,
      args: [
          NAME,
          VAULT, 
          GAS_ESTIMATE
      ],
      skipIfAlreadyDeployed: true
    });
  
    if (deployResult.newlyDeployed) {
      log(`- ${deployResult.contractName} deployed at ${deployResult.address} using ${deployResult.receipt.gasUsed} gas`);
    } else {
      log(`- Deployment skipped, using previous deployment at: ${deployResult.address}`)
    }
  };

  module.exports.tags = ['V0', 'adapter', 'gmx', 'avalanche'];