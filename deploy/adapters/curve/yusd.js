const { curvelikePools } = require("../../../test/addresses.json")  

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();

    const NAME = 'CurveYUSDAdapter';
    const POOL = curvelikePools.CurveYUSD
    const GAS_ESTIMATE = 3.3e5

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

  module.exports.tags = ['V0', 'adapter', 'curve', 'yusd'];