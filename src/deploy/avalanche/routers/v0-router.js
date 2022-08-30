const { ethers } = require("hardhat");
const deployOptions = require('../../../misc/deployOptions').avalanche

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();
    
    const feeClaimer = deployer
    const { adapterWhitelist, hopTokens, wnative } = deployOptions
    const BytesManipulationV0 = await deployments.get('BytesManipulationV0')
    const adapters = await Promise.all(adapterWhitelist.map(a => deployments.get(a)))
      .then(a => a.map(_a => _a.address))
    noDuplicates(hopTokens)
    noDuplicates(adapters)

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
    await afterDeployment()
  };

  async function noDuplicates(_array) {
    if ((new Set(_array)).size != _array.length) {
      throw new Error('Duplicated array: ', _array.join(', '))
    }
  }
  
  async function afterDeployment({deployResult, adapters, hopTokens}) {
      const { deployer } = await getNamedAccounts();
      let yakRouter = await ethers.getContractAt('YakRouter', deployResult.address)
      await addAdapters(yakRouter, deployer, adapters)
      await addHopTokens(yakRouter, deployer, hopTokens)
  
  }
  
  async function addAdapters(yakRouter, deployerSigner, adapters) {
      let currentAdapters = await getAdaptersForRouter(yakRouter)
      let allAdaptersIncluded = adapters.length == currentAdapters.length && adapters.every(a => currentAdapters.includes(a))
      if (!allAdaptersIncluded) {
        // Add adapters
        console.log('Adding adapters:', adapters.join('\n\t- '))
        await yakRouter.connect(deployerSigner).setAdapters(
          adapters
        ).then(r => r.wait(2))
      }
  }
  
  async function addHopTokens(yakRouter, deployerSigner, hopTokens) {
    let currentHopTokens = await getTrustedTokensForRouter(yakRouter)
    let allTrustedTknAdded = hopTokens.length == currentHopTokens.length && hopTokens.every(a => currentHopTokens.includes(a))
    if (!allTrustedTknAdded) {
      // Add trusted tokens
      console.log('Adding trusted tokens:', hopTokens.join('\n\t- '))
      await yakRouter.connect(deployerSigner).setTrustedTokens(
        hopTokens
      ).then(r => r.wait(2))
    }
  }
  
  async function getAdaptersForRouter(yakRouter) {
      let adapterCount = await yakRouter.adaptersCount().then(r => r.toNumber())
      return Promise.all([...Array(adapterCount).keys()].map(i => yakRouter.ADAPTERS(i)))
  }
  
  async function getTrustedTokensForRouter(yakRouter) {
      let trustedTokensCount = await yakRouter.trustedTokensCount().then(r => r.toNumber())
      return Promise.all([...Array(trustedTokensCount).keys()].map(i => yakRouter.TRUSTED_TOKENS(i)))
  }

  module.exports.tags = ['V0', 'router', 'avalanche'];