module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();
    const { curvelikePools } = require('../../../test/addresses.json')

    const NAME = 'AxialAM3DUSDCYakAdapterV0'
    const POOL = curvelikePools.AxialAM3DUSDC
    const GAS_ESTIMATE = 6.5e5

    log(NAME)
    const deployResult = await deploy(NAME, {
      from: deployer,
      contract: "CurvelikeMetaAdapter",
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

  module.exports.tags = ['V0', 'adapter', 'AM3DUSDC', 'axial'];