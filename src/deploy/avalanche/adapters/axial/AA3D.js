module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();
    const { curvelikePools } = require("../../../../misc/addresses.json")

    const NAME = 'AxialAA3DYakAdapterV0'
    const POOL = curvelikePools.AxialAA3D
    const GAS_ESTIMATE = 3.6e5

    log(NAME)
    const deployResult = await deploy(NAME, {
      from: deployer,
      contract: "SaddleAdapter",
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

  module.exports.tags = ['V0', 'adapter', 'AA3D', 'axial', 'avalanche'];