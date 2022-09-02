module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();

    const NAME = 'KyberAdapter'
    const POOLS = [
        '0xe1dad9e06380bc8962e259ddd6a5257a4f56d525',  // USDTe-USDCe
        // '0x5f1b43d6056898c1573026955a2516ee5329630b',  // MIM-USDCe
        // '0x85659e7f611add6c0cc95c90249d9db54071ca2e',  // MIM-USDTe
        // '0x44d1b2974b3b8ce93b261f6d15dce5ad57f8933b',  // DYP-WAVAX
        // '0x0f0fc5a5029e3d155708356b422d22cc29f8b3d4',  // WETHe-WAVAX
        // '0xb34068e28a7853123afafc936c972123eb9895a2',  // XAVA-WAVAX
        // '0x535a99a079d64b8c3f4cc264eba70d82992b224b',  // APEIN-WAVAX
    ]  // Supported pools
    const GAS_ESTIMATE = 1.82e5  // Gas cost

    log(NAME)
    const deployResult = await deploy(NAME, {
      from: deployer,
      contract: "KyberAdapter",
      gas: 4000000,
      args: [
          NAME,
          POOLS, 
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

  module.exports.tags = ['V0', 'adapter', 'kyber', 'avalanche'];