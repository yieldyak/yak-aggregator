const { curvelikePools } = require("../../../../misc/addresses.json")  

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();

    const NAME = 'CurveAaveAdapterV0';
    const POOL = curvelikePools.CurveAave
    const GAS_ESTIMATE = 8e5

    log(NAME)
    const deployResult = await deploy(NAME, {
      from: deployer,
      contract: "Curve2Adapter",
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

  module.exports.tags = ['V0', 'adapter', 'curve', 'aave', 'avalanche'];