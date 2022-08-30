module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments
  const { deployer } = await getNamedAccounts()

  const GAS_ESTIMATE = 82e3
  log(`MiniYakAdapterV0`)
  const deployResult = await deploy("MiniYakAdapterV0", {
    from: deployer,
    contract: "MiniYakAdapter",
    gas: 4000000,
    args: [ GAS_ESTIMATE ],
    skipIfAlreadyDeployed: true
  })
  
    if (deployResult.newlyDeployed) {
      log(`- ${deployResult.contractName} deployed at ${deployResult.address} using ${deployResult.receipt.gasUsed} gas`);
    } else {
      log(`- Deployment skipped, using previous deployment at: ${deployResult.address}`)
    }
};

module.exports.tags = ['V0', 'adapter', 'miniYak'];