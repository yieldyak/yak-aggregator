module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const { platypus } = require('../../../../test/addresses.json')

  const NAME = 'PlatypusYakAdapterV2'
  const GAS_ESTIMATE = 5e5
  const INIT_POOLS = [
    platypus.main, 
    platypus.frax,
    platypus.mim,
    platypus.ust,
  ]

  log(NAME)
  const deployResult = await deploy(NAME, {
    from: deployer,
    contract: "PlatypusAdapter",
    gas: 4000000,
    args: [
        NAME,
        GAS_ESTIMATE
    ],
    skipIfAlreadyDeployed: true
  });

  if (deployResult.newlyDeployed) {
    log(`- ${deployResult.contractName} deployed at ${deployResult.address} using ${deployResult.receipt.gasUsed} gas`);
    const Adapter = await ethers.getContractAt('PlatypusAdapter', deployResult.address)
    const deployerSig = await ethers.getSigner(deployer)
    const tx = await Adapter
      .connect(deployerSig)
      .addPools(INIT_POOLS)
      .then(r => r.wait(2))
    if (tx.status == 1) {
      console.log(`Pools added:\n\t${INIT_POOLS.join('\n\t')}`)
    } else {
      console.log(`Failed to add pools:\n\t${INIT_POOLS.join('\n\t')}`)
    }
  } else {
    log(`- Deployment skipped, using previous deployment at: ${deployResult.address}`)
  }
};

module.exports.tags = ['adapter', 'platypus', 'pv2', 'avalanche'];