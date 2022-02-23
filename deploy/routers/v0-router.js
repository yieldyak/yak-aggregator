const { ethers } = require("hardhat");
const { assets } = require('../../test/addresses.json')

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
    
    // const SnobS3YakAdapterV0 = await deployments.get("SnobS3YakAdapterV0")
    const SnobF3YakAdapterV0 = await deployments.get("SnobF3YakAdapterV0")
    const SnobS4YakAdapterV0 = await deployments.get("SnobS4YakAdapterV0")
    // const GondolaUSDTYakAdapterV0 = await deployments.get("GondolaUSDTYakAdapterV0")
    // const GondolaBTCYakAdapterV0 = await deployments.get("GondolaBTCYakAdapterV0")
    // const GondolaDAIYakAdapterV0 = await deployments.get("GondolaDAIYakAdapterV0")
    // const GondolaETHYakAdapterV0 = await deployments.get("GondolaETHYakAdapterV0")
    // const GondolaUSDTUSDTeYakAdapterV0 = await deployments.get("GondolaUSDTUSDTeYakAdapterV0")
    // const GondolaWBTCWBTCeYakAdapterV0 = await deployments.get("GondolaWBTCWBTCeYakAdapterV0")
    // const GondolaWETHWETHeYakAdapterV0 = await deployments.get("GondolaWETHWETHeYakAdapterV0")
    // const GondolaWBTCrenBTCYakAdapterV0 = await deployments.get("GondolaWBTCrenBTCYakAdapterV0")
    // const GondolaDAIDAIeYakAdapterV0 = await deployments.get("GondolaDAIDAIeYakAdapterV0")
    // const GondolaUSDTeDAIeYakAdapterV0 = await deployments.get("GondolaUSDTeDAIeYakAdapterV0")
    // const GondolaUSDTeUSDCeAdapterV0 = await deployments.get('GondolaUSDTeUSDCeAdapterV0')
    // const GondolaUSDTeTSDAdapterV0 = await deployments.get('GondolaUSDTeTSDAdapterV0')
    const GondolaYAKmYAKAdapterV0 = await deployments.get('GondolaYAKmYAKAdapterV0')
    const SushiswapYakAdapterV0 = await deployments.get("SushiYakAdapterV0")
    const PangolinYakAdapterV0 = await deployments.get("PangolinYakAdapterV0")
    const PartyswapAdapterV0 = await deployments.get('PartyswapAdapterV0')
    const LydiaYakAdapterV0 = await deployments.get("LydiaYakAdapterV0")
    // const PandaYakAdapterV0 = await deployments.get("PandaYakAdapterV0")
    // const ZeroYakAdapterV0 = await deployments.get("ZeroYakAdapterV0")
    const YetiYakAdapterV0 = await deployments.get("YetiYakAdapterV0")
    const ElkYakAdapterV0 = await deployments.get("ElkYakAdapterV0")
    const ComplusAdapterV0 = await deployments.get("ComplusAdapterV0")
    const OliveYakAdapterV0 = await deployments.get("OliveYakAdapterV0")
    const CanaryYakAdapterV0 = await deployments.get("CanaryYakAdapterV0")
    const BaguetteYakAdapterV0 = await deployments.get('BaguetteYakAdapterV0')
    const TraderJoeYakAdapterV0 = await deployments.get('TraderJoeYakAdapterV0')
    const BridgeMigrationAdapterV0 = await deployments.get('BridgeMigrationAdapterV0')
    const SynapsePlainYakAdapterV0 = await deployments.get('SynapsePlainYakAdapterV0')
    const MiniYakAdapterV0 = await deployments.get('MiniYakAdapterV0')
    const AxialAS4DYakAdapterV0 = await deployments.get('AxialAS4DYakAdapterV0')

    // const GondolaUSD4AdapterV0 = await deployments.get('GondolaUSD4AdapterV0')
    const GondolaUSDAdapterV0 = await deployments.get('GondolaUSDAdapterV0')
    const GondolaUSDTeMIMAdapterV0 = await deployments.get('GondolaUSDTeMIMAdapterV0')
    const GondolaYAKmYAKv2AdapterV0 = await deployments.get('GondolaYAKmYAKv2AdapterV0')
    const CurveAaveAdapterV0 = await deployments.get('CurveAaveAdapterV0')
    const CurveMimAdapterV0 = await deployments.get('CurveMimAdapterV0')
    const Curve3poolV2AdapterV0 = await deployments.get('Curve3poolV2AdapterV0')
    const CurveRenAdapterV0 = await deployments.get('CurveRenAdapterV0')
    const CurveAtricryptoAdapterV0 = await deployments.get('CurveAtricryptoAdapterV0')
    
    const AxialAM3DUSDCYakAdapterV0 = await deployments.get('AxialAM3DUSDCYakAdapterV0')
    const AxialAM3DYakAdapterV0 = await deployments.get('AxialAM3DYakAdapterV0')
    const AxialAA3DYakAdapterV0 = await deployments.get('AxialAA3DYakAdapterV0')
    const AxialAC4DYakAdapterV0 = await deployments.get('AxialAC4DYakAdapterV0')

    const PlatypusV1YakAdapterV0 = await deployments.get('PlatypusV1YakAdapterV0')
    const KyberAdapter = await deployments.get('KyberAdapter')
    const XJoeAdapter = await deployments.get('XJoeAdapter')
    const WAvaxAdapter = await deployments.get('WAvaxAdapter')
    const GmxAdapterV0 = await deployments.get('GmxAdapterV0')
    const CurveUSDCAdapterV0 = await deployments.get('CurveUSDCAdapterV0')
    const CurveMoreAdapterV0 = await deployments.get('CurveMoreAdapterV0')
    const HakuSwapAdapterV0 = await deployments.get('HakuSwapAdapterV0')

    // Bottom arguments can all be changed after the deployment
    const TRUSTED_TOKENS = [
        assets.WAVAX,
        assets.WETHe,
        assets.USDTe,
        assets.USDCe,
        assets.JOE,
        assets.DAIe,
        assets.LINKe,
        assets.WBTCe,
        assets.MIM,
        assets.PNG,
        assets.YAK,
        // assets.QI,
        // assets.SPELL
    ];
    const ADAPTERS = [
        PangolinYakAdapterV0.address,
        SushiswapYakAdapterV0.address, 
        // GondolaETHYakAdapterV0.address,
        // GondolaDAIYakAdapterV0.address, 
        // GondolaBTCYakAdapterV0.address,
        // GondolaUSDTYakAdapterV0.address,
        // GondolaDAIDAIeYakAdapterV0.address,
        // GondolaUSDTUSDTeYakAdapterV0.address,
        // GondolaWBTCWBTCeYakAdapterV0.address,
        // GondolaWETHWETHeYakAdapterV0.address,
        // GondolaWBTCrenBTCYakAdapterV0.address,
        // GondolaUSDTeDAIeYakAdapterV0.address,
        // GondolaUSDTeUSDCeAdapterV0.address, 
        // GondolaUSDTeTSDAdapterV0.address,
        GondolaYAKmYAKAdapterV0.address,
        SnobF3YakAdapterV0.address,
        // SnobS3YakAdapterV0.address,
        SnobS4YakAdapterV0.address, 
        LydiaYakAdapterV0.address,
        ElkYakAdapterV0.address, 
        // PandaYakAdapterV0.address, 
        CanaryYakAdapterV0.address, 
        TraderJoeYakAdapterV0.address,
        BridgeMigrationAdapterV0.address,
        SynapsePlainYakAdapterV0.address,
        // ZeroYakAdapterV0.address, 
        YetiYakAdapterV0.address,
        OliveYakAdapterV0.address,
        ComplusAdapterV0.address,
        BaguetteYakAdapterV0.address,
        MiniYakAdapterV0.address,
        PartyswapAdapterV0.address,
        AxialAS4DYakAdapterV0.address,
        AxialAM3DUSDCYakAdapterV0.address,
        AxialAM3DYakAdapterV0.address,
        AxialAA3DYakAdapterV0.address,
        AxialAC4DYakAdapterV0.address,
        // GondolaUSD4AdapterV0.address,
        GondolaUSDAdapterV0.address,
        GondolaUSDTeMIMAdapterV0.address,
        GondolaYAKmYAKv2AdapterV0.address,
        CurveAaveAdapterV0.address, 
        CurveMimAdapterV0.address,
        Curve3poolV2AdapterV0.address,
        // CurveRenAdapterV0.address,
        CurveAtricryptoAdapterV0.address,
        PlatypusV1YakAdapterV0.address,
        KyberAdapter.address,
        XJoeAdapter.address,
        WAvaxAdapter.address,
        GmxAdapterV0.address,
        CurveUSDCAdapterV0.address,
        CurveMoreAdapterV0.address,
        HakuSwapAdapterV0.address
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
	let allAdaptersIncluded = ADAPTERS.length == currentAdapters.length && ADAPTERS.every(a => currentAdapters.includes(a))
	if (!allAdaptersIncluded) {
		// Add adapters
		console.log('Adding adapters:', ADAPTERS.join('\n\t- '))
		await yakRouter.connect(deployerSigner).setAdapters(
			ADAPTERS
		).then(r => r.wait(2))
	}
	// Add trusted tokens if some of them are not added
	let currentTrustedTokens = await getTrustedTokensForRouter(yakRouter)
	let allTrustedTknAdded = TRUSTED_TOKENS.length == currentTrustedTokens.length && TRUSTED_TOKENS.every(a => currentTrustedTokens.includes(a))
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