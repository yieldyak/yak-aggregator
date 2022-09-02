const deployOptions = require('../../../misc/deployOptions').avalanche

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();
    
    const feeClaimer = deployer
    const { adapterWhitelist, hopTokens, wnative } = deployOptions
    const BytesManipulationV0 = await deployments.get('BytesManipulationV0')
    const adapters = await Promise.all(adapterWhitelist.map(a => deployments.get(a)))
      .then(a => a.map(_a => _a.address))

    console.log('YalRouter deployment arguments: ', [
      adapters, 
      hopTokens, 
      feeClaimer,
      wnative
    ])
    log(`YakRouter`)
    const deployResult = await deploy("YakRouter", {
      from: deployer,
      contract: "YakRouter",
      gas: 4000000,
      args: [
        adapters, 
        hopTokens, 
        feeClaimer, 
        wnative,
      ],
		  libraries: {
        'BytesManipulation': BytesManipulationV0.address
		  },
		  skipIfAlreadyDeployed: true
    })

    if (deployResult.newlyDeployed) {
      log(`- ${deployResult.contractName} deployed at ${deployResult.address} using ${deployResult.receipt.gasUsed} gas`);
    } else {
      log(`- Deployment skipped, using previous deployment at: ${deployResult.address}`)
	  }
  };

  module.exports.tags = ['V0', 'router', 'avalanche'];