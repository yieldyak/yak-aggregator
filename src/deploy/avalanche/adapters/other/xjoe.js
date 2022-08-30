module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();

    const NAME = 'XJoeAdapter';
    const GAS_ESTIMATE = 1.5e5

    log(NAME)
    const deployResult = await deploy(NAME, {
      from: deployer,
      contract: "XJoeAdapter",
      gas: 4000000,
      args: [ GAS_ESTIMATE ],
      skipIfAlreadyDeployed: true
    });
  
    if (deployResult.newlyDeployed) {
      log(`- ${deployResult.contractName} deployed at ${deployResult.address} using ${deployResult.receipt.gasUsed} gas`);
    } else {
      log(`- Deployment skipped, using previous deployment at: ${deployResult.address}`)
    }
  };

  module.exports.tags = ['V0', 'adapter', 'joe', 'xjoe', 'avalanche'];