const { curvelikePools } = require("../../../test/addresses.json")  

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();

    const NAME = 'Curve3poolV2AdapterV0';
    const POOL = curvelikePools.Curve3poolV2
    const GAS_ESTIMATE = 2.9e5

    log(NAME)
    const deployResult = await deploy(NAME, {
      from: deployer,
      contract: "CurvePlainAdapter",
      gas: 4000000,
      args: [
          NAME,
          POOL,
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

  module.exports.tags = ['V0', 'adapter', 'curve', '3poolV2'];