const { deployments, ethers } = require("hardhat")
const helpers = require('./helpers')
const addresses = require('./addresses.json')

TRACER_ENABLED = process.argv.includes('--logs')
const { assets, unilikeFactories, curvelikePools, unilikeRouters } = addresses
let ADAPTERS = {}


const _curvelikeAdapters = async () => {
    const [ deployer ] = await ethers.getSigners()
    // Import live contracts
    const pools = {
        GondolaUSDTUSDTe: await ethers.getContractAt('ICurveLikePool', curvelikePools.GondolaUSDTUSDTe),
        GondolaUSDTeUSDCe: await ethers.getContractAt('ICurveLikePool', curvelikePools.GondolaUSDTeUSDCe),
        GondolaUSDTeTSD: await ethers.getContractAt('ICurveLikePool', curvelikePools.GondolaUSDTeTSD),
        GondolaUSDT: await ethers.getContractAt('ICurveLikePool', curvelikePools.GondolaUSDT),
        GondolaDAI: await ethers.getContractAt('ICurveLikePool', curvelikePools.GondolaDAI),
        GondolaBTC: await ethers.getContractAt('ICurveLikePool', curvelikePools.GondolaBTC),
        GondolaETH: await ethers.getContractAt('ICurveLikePool', curvelikePools.GondolaETH),
        SnobF3D: await ethers.getContractAt('ICurveLikePool', curvelikePools.snobF3D),
        SnobS3D: await ethers.getContractAt('ICurveLikePool', curvelikePools.snobS3D),
        SnobS4D: await ethers.getContractAt('ICurveLikePool', curvelikePools.snobS4D),
    }
    // Init Adapters
    const adapters = {}
    const  CurveLikeAdapterFactory = await ethers.getContractFactory('CurveLikeAdapter')
    adapters['SnobF3DAdapter'] = await CurveLikeAdapterFactory.connect(deployer).deploy(
        'SnobF3D YakAdapter',
        curvelikePools.snobF3D, 
        3,  // Token-count
        170000
    )
    adapters['SnobS3DAdapter'] = await CurveLikeAdapterFactory.connect(deployer).deploy(
        'SnobS3D YakAdapter',
        curvelikePools.snobS3D, 
        3,  // Token-count
        170000
    )
    adapters['SnobS4DAdapter'] = await CurveLikeAdapterFactory.connect(deployer).deploy(
        'SnobS4D YakAdapter',
        curvelikePools.snobS4D, 
        4,  // Token-count
        180000
    )
    adapters['GondolaDAIAdapter'] = await CurveLikeAdapterFactory.connect(deployer).deploy(
        'GondolaDAI YakAdapter',
        curvelikePools.GondolaDAI, 
        2,  // Token-count
        150000
    )
    adapters['GondolaBTCAdapter'] = await CurveLikeAdapterFactory.connect(deployer).deploy(
        'GondolaBTC YakAdapter',
        curvelikePools.GondolaBTC, 
        2,  // Token-count
        150000
    )
    adapters['GondolaUSDTAdapter'] = await CurveLikeAdapterFactory.connect(deployer).deploy(
        'GondolaUSDT YakAdapter',
        curvelikePools.GondolaUSDT, 
        2,  // Token-count
        150000
    )
    adapters['GondolaETHAdapter'] = await CurveLikeAdapterFactory.connect(deployer).deploy(
        'GondolaETH YakAdapter',
        curvelikePools.GondolaETH, 
        2,  // Token-count
        150000
    )
    adapters['GondolaUSDTeUSDCeAdapter'] = await CurveLikeAdapterFactory.connect(deployer).deploy(
        'GondolaUSDTeUSDCe YakAdapter',
        curvelikePools.GondolaUSDTeUSDCe, 
        2,  // Token-count
        150000
    )
    adapters['GondolaUSDTeTSDAdapter'] = await CurveLikeAdapterFactory.connect(deployer).deploy(
        'GondolaUSDTeTSD YakAdapter',
        curvelikePools.GondolaUSDTeTSD, 
        2,  // Token-count
        150000
    )
    adapters['GondolaUSDTUSDTeAdapter'] = await CurveLikeAdapterFactory.connect(deployer).deploy(
        'GondolaUSDTUSDTe YakAdapter',
        curvelikePools.GondolaUSDTUSDTe, 
        2,  // Token-count
        150000
    )
    ADAPTERS = {...adapters, ...ADAPTERS}
    // Set tags
    if (TRACER_ENABLED) {
        hre.tracer.nameTags['deployer'] = deployer
        for (key of Object.keys(adapters)) {
            hre.tracer.nameTags[adapters[key].address] = key
        }
    }
    return {
        CurveLikeAdapterFactory,
        adapters, 
        pools,
    }
}
const _unilikeAdapters = async () => {
    const [ deployer ] = await ethers.getSigners()
    const adapters = {}
    const UnilikeAdapterFactory = await ethers.getContractFactory('UnilikeAdapter')
    adapters['ElkAdapter'] = await UnilikeAdapterFactory.connect(deployer).deploy(
        'Elk YakAdapter',
        unilikeFactories.elk,
        3,
        100000
    )
    adapters['PandaAdapter'] = await UnilikeAdapterFactory.connect(deployer).deploy(
        'PandaSwap YakAdapter',
        unilikeFactories.pandaswap,
        3,
        100000
    )
    adapters['OliveAdapter'] = await UnilikeAdapterFactory.connect(deployer).deploy(
        'OliveSwap YakAdapter',
        unilikeFactories.olive,
        2,
        100000
    )
    adapters['SushiswapAdapter'] = await UnilikeAdapterFactory.connect(deployer).deploy(
        'Sushiswap YakAdapter',
        unilikeFactories.sushiswap,
        3,
        100000
    )
    adapters['ComplusAdapter'] = await UnilikeAdapterFactory.connect(deployer).deploy(
        'Complus YakAdapter',
        unilikeFactories.complus,
        3,
        100000
    )
    adapters['ZeroAdapter'] = await UnilikeAdapterFactory.connect(deployer).deploy(
        'Zero YakAdapter',
        unilikeFactories.zero,
        3,
        100000
    )
    adapters['PangolinAdapter'] = await UnilikeAdapterFactory.connect(deployer).deploy(
        'Pangolin YakAdapter',
        unilikeFactories.pangolin,
        3,
        100000
    )
    adapters['LydiaAdapter'] = await UnilikeAdapterFactory.connect(deployer).deploy(
        'Lydia YakAdapter',
        unilikeFactories.lydia,
        2,
        100000
    )
    adapters['YetiAdapter'] = await UnilikeAdapterFactory.connect(deployer).deploy(
        'Yeti YakAdapter',
        unilikeFactories.yeti,
        3,
        100000
    )
    ADAPTERS = {...adapters, ...ADAPTERS}
    // Set tags
    if (TRACER_ENABLED) {
        hre.tracer.nameTags['deployer'] = deployer
        for (key of Object.keys(adapters)) {
            hre.tracer.nameTags[adapters[key].address] = key
        }
    }
    return {
        UnilikeAdapterFactory, 
        adapters,
    }
}
const _bridgeMigrationAdapters = async () => {
    const [ deployer ] = await ethers.getSigners()
    const adapterFactory = await ethers.getContractFactory('BridgeMigrationAdapter')
    const oldTokens = [
        await ethers.getContractFactory('TestToken').then(f => f.deploy('TToken1', 'TT1')),
        await ethers.getContractFactory('TestToken').then(f => f.deploy('TToken2', 'TT2'))
    ]
    const bridgeTokens = [
        await ethers.getContractFactory('BridgeToken').then(f => f.deploy('BToken1', 'BT1')),
        await ethers.getContractFactory('BridgeToken').then(f => f.deploy('BToken1', 'BT1'))
    ]
    for (let i=0; i<bridgeTokens.length; i++) {
        const bt = bridgeTokens[i]
        const ot = oldTokens[i]
        await bt.addSwapToken(ot.address, ethers.utils.parseUnits('300'))
    }
    const gasCost = 71000
    adapter = await adapterFactory.connect(deployer).deploy(
        bridgeTokens.map(t => t.address),
        oldTokens.map(t => t.address),
        gasCost
    )
    // Set tags
    if (TRACER_ENABLED) {
        hre.tracer.nameTags['deployer'] = deployer
        hre.tracer.nameTags[adapter.address] = 'BridgeMigrationAdapter'
    }
    return {
        adapterFactory, 
        adapter,
        oldTokens,
        bridgeTokens
    }
}
const general = deployments.createFixture(async () => {
    // Get token contracts
    const tokenContracts = {}
    for (tknSymbol of Object.keys(assets)) {
        tokenContracts[tknSymbol] = await helpers.getTokenContract(assets[tknSymbol])
    }
    // Get accounts
    const genNewAccount = await helpers.makeAccountGen()
    const deployer = genNewAccount()
    // Two dexes to help with testing token->token trades
    const PangolinRouter = await ethers.getContractAt('IUnilikeAVAXRouter', unilikeRouters.pangolin)
    const SushiswapRouter = await ethers.getContractAt('IUnilikeETHRouter', unilikeRouters.sushiswap)
    const ZeroRouter = await ethers.getContractAt('IUnilikeETHRouter', unilikeRouters.zero)
    // Set tags
    if (TRACER_ENABLED) {
        hre.tracer.nameTags[deployer.address] = 'deployer'
        for (key of Object.keys(assets)) {
            hre.tracer.nameTags[assets[key]] = key
        }
        for (key of Object.keys(curvelikePools)) {
            hre.tracer.nameTags[curvelikePools[key]] = key
        }
        for (key of Object.keys(unilikeRouters)) {
            hre.tracer.nameTags[unilikeRouters[key]] = key
        }
    }
    // Constants
    const U256_MAX  = ethers.constants.MaxUint256
    const ZERO  = ethers.constants.Zero

    return {
        unilikeFactories,
        SushiswapRouter,
        tokenContracts,
        unilikeRouters,
        curvelikePools,
        PangolinRouter,
        genNewAccount,
        ZeroRouter,
        deployer,
        U256_MAX,
        assets,
        ZERO
    }
})
const unilikeAdapters = deployments.createFixture(_unilikeAdapters)
const curvelikeAdapters = deployments.createFixture(_curvelikeAdapters)
const bridgeMigration = deployments.createFixture(_bridgeMigrationAdapters)
const router = deployments.createFixture(async ({ }) => {
    const [ deployer ] = await ethers.getSigners()
    const _unilike = await _unilikeAdapters()
    const _curvelike = await _curvelikeAdapters()
    const _bridgeMigration = await _bridgeMigrationAdapters()

    let adapters
    if (ADAPTERS.length>0) {
        adapters = ADAPTERS
    } else {
        adapters = {
            ..._unilike.adapters,
            ..._curvelike.adapters,
            'BridgeMigration': _bridgeMigration.adapter
        }
    }
    const trustedTokens = [
        assets.WAVAX,
        assets.WETHe,
        assets.USDTe,
        assets.USDCe,
        assets.DAIe,
        assets.WBTCe,
        assets.LINKe,
        assets.PNG, 
        assets.JOE,
        assets.PEFI,
        assets.SNOB
    ]
    // Deploy the libraries
    const BytesManipulationFactory = await ethers.getContractFactory('BytesManipulation')
    const BytesManipulation = await BytesManipulationFactory.deploy()
    // Init Yak Router
    const YakRouterFactory = await ethers.getContractFactory('YakRouter', { 
        libraries: {
            'BytesManipulation': BytesManipulation.address
        } 
    })
    const YakRouter = await YakRouterFactory.connect(deployer).deploy(
        Object.values(adapters).map(a=>a.address), 
        trustedTokens, 
        deployer.address
    )
    // Set tags
    if (TRACER_ENABLED) {
        hre.tracer.nameTags['deployer'] = deployer
        hre.tracer.nameTags[YakRouter.address] = 'YakRouter'
    }

    return {
        YakRouterFactory, 
        YakRouter, 
        adapters
    }
})

module.exports = {
    curvelikeAdapters, 
    unilikeAdapters,
    bridgeMigration,
    general, 
    router
}
