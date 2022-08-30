module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();
    const { other, assets } = require("../../../../misc/addresses.json")
    const { geode } = require('../../../../misc/constants.json')

    // GeodeWithdrawalPoolyyAvaxAdapter
    const NAME = 'GWPyyAvaxAdapter'
    const PORTAL = other.GeodePortal
    const PLANET_ID = geode.yyPlanet
    const GAS_ESTIMATE = 4.5e5

    log(NAME)
    const deployResult = await deploy(NAME, {
      from: deployer,
      contract: "GeodeWPAdapter",
      gas: 4000000,
      args: [
          NAME,
          PORTAL, 
          PLANET_ID, 
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

  module.exports.tags = ['V0', 'adapter', 'geode', 'yyAvax', 'avalanche'];