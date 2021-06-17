const { ethers } = require("hardhat");

const WAVAX = '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7'

async function getAdaptersForRouter(yakRouter) {
    let adapterCount = await yakRouter.adaptersCount().then(r => r.toNumber())
    return Promise.all(
        [...Array(adapterCount).keys()].map(i => yakRouter.ADAPTERS(i))
    )
}

async function getTrustedTokensForRouter(yakRouter) {
  let trustedTokensCount = await yakRouter.trustedTokensCount().then(r => r.toNumber())
  return Promise.all(
      [...Array(trustedTokensCount).keys()].map(i => yakRouter.TRUSTED_TOKENS(i))
  )
}

async function noDuplicates(_array) {
  if ((new Set(_array)).size != _array.length) {
    throw new Error('Duplicated array: ', _array.join(', '))
  }
}

async function routerHasWAVAXAllowance(yakRouterAddress) {
  let wavaxContract = await ethers.getContractAt('contracts/interface/IERC20.sol:IERC20', WAVAX)
  let allowance = await wavaxContract.allowance(yakRouterAddress, WAVAX)
  return allowance.gt('0')
}

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();

    const BytesManipulationV0 = await deployments.get("BytesManipulationV0")
    
    const SnobS3YakAdapterV0 = await deployments.get("SnobS3YakAdapterV0")
    const SnobF3YakAdapterV0 = await deployments.get("SnobF3YakAdapterV0")
    const GondolaUSDTYakAdapterV0 = await deployments.get("GondolaUSDTYakAdapterV0")
    const GondolaBTCYakAdapterV0 = await deployments.get("GondolaBTCYakAdapterV0")
    const GondolaDAIYakAdapterV0 = await deployments.get("GondolaDAIYakAdapterV0")
    const GondolaETHYakAdapterV0 = await deployments.get("GondolaETHYakAdapterV0")
    const SushiswapYakAdapterV0 = await deployments.get("SushiYakAdapterV0")
    const PangolinYakAdapterV0 = await deployments.get("PangolinYakAdapterV0")
    const LydiaYakAdapterV0 = await deployments.get("LydiaYakAdapterV0")
    const PandaYakAdapterV0 = await deployments.get("PandaYakAdapterV0")
    const ZeroYakAdapterV0 = await deployments.get("ZeroYakAdapterV0")
    const YetiYakAdapterV0 = await deployments.get("YetiYakAdapterV0")
    const ElkYakAdapterV0 = await deployments.get("ElkYakAdapterV0")
    const ComplusAdapterV0 = await deployments.get("ComplusAdapterV0")
    const OliveYakAdapterV0 = await deployments.get("OliveYakAdapterV0")
    const CanaryYakAdapterV0 = await deployments.get("CanaryYakAdapterV0")
    const BaguetteYakAdapterV0 = await deployments.get('BaguetteYakAdapterV0')

    // Bottom arguments can all be changed after the deployment
    const TRUSTED_TOKENS = [
        "0xbA7dEebBFC5fA1100Fb055a87773e1E99Cd3507a",   // DAI
        "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7", // WAVAX
        "0x60781C2586D68229fde47564546784ab3fACA982",   // PNG
        "0xde3A24028580884448a5397872046a019649b084",  // USDT
        "0xf20d962a6c8f70c731bd838a3a388D7d48fA6e15", // ETH
        "0x008E26068B3EB40B443d3Ea88c1fF99B789c10F7", // ZERO
    ];
    const ADAPTERS = [
        PangolinYakAdapterV0.address,
        SushiswapYakAdapterV0.address, 
        GondolaETHYakAdapterV0.address,
        GondolaDAIYakAdapterV0.address, 
        GondolaBTCYakAdapterV0.address,
        GondolaUSDTYakAdapterV0.address,
        SnobF3YakAdapterV0.address,
        SnobS3YakAdapterV0.address, 
        ZeroYakAdapterV0.address, 
        LydiaYakAdapterV0.address,
        YetiYakAdapterV0.address,
        ElkYakAdapterV0.address, 
        PandaYakAdapterV0.address, 
        OliveYakAdapterV0.address,
        ComplusAdapterV0.address,
        CanaryYakAdapterV0.address, 
        BaguetteYakAdapterV0.address
    ];
    const FEE_CLAIMER = deployer
    noDuplicates(TRUSTED_TOKENS)
    noDuplicates(ADAPTERS)
    console.log('YalRouter deployment arguments: ', [
      ADAPTERS, 
      TRUSTED_TOKENS, 
      FEE_CLAIMER
    ])
    log(`V0)YakRouter`)
    const deployResult = await deploy("YakRouterV0", {
      from: deployer,
      contract: "YakRouter",
      gas: 4000000,
      args: [
        ADAPTERS, 
        TRUSTED_TOKENS, 
        FEE_CLAIMER
      ],
		libraries: {
		'BytesManipulation': BytesManipulationV0.address
		},
		skipIfAlreadyDeployed: true
    });
  
    if (deployResult.newlyDeployed) {
		log(`- ${deployResult.contractName} deployed at ${deployResult.address} using ${deployResult.receipt.gasUsed} gas`);
    } else {
		log(`- Deployment skipped, using previous deployment at: ${deployResult.address}`)
	}

	let yakRouter = await ethers.getContractAt('YakRouter', deployResult.address)
	let deployerSigner = new ethers.Wallet(process.env.PK_DEPLOYER, ethers.provider)

	// Add adapters if some of them are not added
	let currentAdapters = await getAdaptersForRouter(yakRouter)
	let allAdaptersIncluded = ADAPTERS.filter(a => !currentAdapters.includes(a)).length == 0
	if (!allAdaptersIncluded) {
		// Add adapters
		console.log('Adding adapters:', ADAPTERS.join('\n\t- '))
		await yakRouter.connect(deployerSigner).setAdapters(
			ADAPTERS
		).then(r => r.wait(2))
	}
	// Add trusted tokens if some of them are not added
	let currentTrustedTokens = await getTrustedTokensForRouter(yakRouter)
	let allTrustedTknAdded = TRUSTED_TOKENS.filter(t => !currentTrustedTokens.includes(t)).length == 0
	if (!allTrustedTknAdded) {
		// Add trusted tokens
		console.log('Adding trusted tokens:', TRUSTED_TOKENS.join('\n\t- '))
		await yakRouter.connect(deployerSigner).setTrustedTokens(
			TRUSTED_TOKENS
		).then(r => r.wait(2))
	}
	// Approve router for WAVAX contract
	let positiveAllowance = await routerHasWAVAXAllowance(yakRouter.address)
	if (!positiveAllowance) {
    throw new Error('Router is missing allowance for WAVAX contract')
		// // Increase allowance
		// console.log('Increasing router allowance for WAVAX')
		// await yakRouter.connect(deployerSigner).approveTokenForSpender(
		// 	WAVAX, 
		// 	WAVAX, 
		// 	ethers.constants.MaxUint256
		// ).then(r => r.wait(2))
	}
    
  };

  module.exports.tags = ['V0', 'router'];