module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();
    const { curvelikePools } = require('../../../../test/addresses.json')

    const NAME = 'AxialAM3DYakAdapterV0'
    const POOL = curvelikePools.AxialAM3D
    const GAS_ESTIMATE = 3.7e5

    log(NAME)
    const deployResult = await deploy(NAME, {
      from: deployer,
      contract: "CurveLikeAdapter",
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

  module.exports.tags = ['V0', 'adapter', 'AM3D', 'axial', 'avalanche'];