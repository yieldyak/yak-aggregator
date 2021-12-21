const { deployments, ethers } = require("hardhat")
const helpers = require('./helpers')
const addresses = require('./addresses.json')

TRACER_ENABLED = process.argv.includes('--logs')
const { assets, unilikeFactories, curvelikePools, unilikeRouters } = addresses
let ADAPTERS = {}

const _curveAdapter = async () => {
    const Curve1AdaptorFactory = ethers.getContractFactory('Curve1Adapter')
    const Curve2AdaptorFactory = ethers.getContractFactory('Curve2Adapter')
    const CurvePlainAdapterFactory = ethers.getContractFactory('CurvePlainAdapter')
    const CurveMimAdapterFactory = ethers.getContractFactory('CurveMimAdapter')
    const [ 
        CurveAave,
        CurveAtricrypto,
        CurveRen,
        Curve3poolV2,
        CurveMim,
        CurveAaveAdapter,
        CurveAtricryptoAdapter, 
        CurveRenAdapter, 
        Curve3poolV2Adapter, 
        CurveMimAdapter
    ] = await Promise.all([
        ethers.getContractAt('ICurve2', curvelikePools.CurveAave),
        ethers.getContractAt('ICurve1', curvelikePools.CurveAtricrypto),
        ethers.getContractAt('ICurve2', curvelikePools.CurveRen),
        ethers.getContractAt('ICurvePlain', curvelikePools.Curve3poolV2),
        ethers.getContractAt('ICurveMim', curvelikePools.CurveMim),
        Curve2AdaptorFactory.then(f => f.deploy('CurveAaveAdapter', curvelikePools.CurveAave, 9.1e5)),
        Curve1AdaptorFactory.then(f => f.deploy('CurveAtricryptoAdapter', curvelikePools.CurveAtricrypto, 1.098e6)),
        Curve2AdaptorFactory.then(f => f.deploy('CurveRenAdapter', curvelikePools.CurveRen, 6.3e5)),
        CurvePlainAdapterFactory.then(f => f.deploy('Curve3poolV2Adapter', curvelikePools.Curve3poolV2, 2.9e5)),
        CurveMimAdapterFactory.then(f => f.deploy('CurveMimAdapter', 1.25e6))
    ])
    return { 
        CurveAave,
        CurveAtricrypto,
        CurveRen,
        Curve3poolV2,
        CurveMim, 
        CurveAaveAdapter,
        CurveAtricryptoAdapter, 
        CurveRenAdapter, 
        Curve3poolV2Adapter, 
        CurveMimAdapter
    }
}

const _axialAdapter = async () => {
    const CurvelikeMetaAdapterFactory = ethers.getContractFactory('CurvelikeMetaAdapter')
    const CurveLikeAdapterFactory = ethers.getContractFactory('CurveLikeAdapter')
    const [
        AxialAM3DUSDC, 
        AxialAM3D, 
        AxialAC4D,
        AxialAA3D,
        AxialAS4D,
        AxialAM3DUSDCAdapter,
        AxialAM3DAdapter,
        AxialAC4DAdapter,
        AxialAA3DAdapter,
        AxialAS4DAdapter
    ] = await Promise.all([
        ethers.getContractAt('ICurvelikeMeta', curvelikePools.AxialAM3DUSDC),
        ethers.getContractAt('ICurveLikePool', curvelikePools.AxialAM3D),
        ethers.getContractAt('ICurveLikePool', curvelikePools.AxialAC4D),
        ethers.getContractAt('ICurveLikePool', curvelikePools.AxialAA3D),
        ethers.getContractAt('ICurveLikePool', curvelikePools.AxialAS4D),
        CurvelikeMetaAdapterFactory.then(f => f.deploy(
            'AxialAM3DUSDCAdapter',
            curvelikePools.AxialAM3DUSDC,
            6.5e5
        )),
        CurveLikeAdapterFactory.then(f => f.deploy(
            'AxialAM3DAdapter',
            curvelikePools.AxialAM3D,
            3.6e5
        )),
        CurveLikeAdapterFactory.then(f => f.deploy(
            'AxialAC4DAdapter',
            curvelikePools.AxialAC4D,
            3.6e5
        )),
        CurveLikeAdapterFactory.then(f => f.deploy(
            'AxialAA3DAdapter',
            curvelikePools.AxialAA3D,
            3.6e5
        )),
        CurveLikeAdapterFactory.then(f => f.deploy(
            'AxialAS4DAdapter',
            curvelikePools.AxialAS4D,
            3.6e5
        ))
    ])
    return { 
        AxialAM3DUSDC,
        AxialAM3D,
        AxialAC4D,
        AxialAA3D,
        AxialAS4D,
        AxialAM3DUSDCAdapter,
        AxialAM3DAdapter,
        AxialAC4DAdapter,
        AxialAA3DAdapter,
        AxialAS4DAdapter
    }
}

const _synapseAdapter = async () => {
    const [ deployer ] = await ethers.getSigners()
    // Import live contracts
    const SynapsePool = await ethers.getContractAt('ICurvelikeMeta', curvelikePools.SynapseDAIeUSDCeUSDTeNUSD)
    // Init Adapters
    const CurvelikeMetaAdapterFactory = await ethers.getContractFactory('CurvelikeMetaAdapter')
    const SynapseAdapter =  await CurvelikeMetaAdapterFactory.connect(deployer).deploy(
        'Synapse YakAdapter',
        curvelikePools.SynapseDAIeUSDCeUSDTeNUSD, 
        2e5
    )
    return {
        SynapseAdapterFactory,
        SynapseAdapter,
        SynapsePool,
        deployer
    }
    
}
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
        170000
    )
    adapters['SnobS3DAdapter'] = await CurveLikeAdapterFactory.connect(deployer).deploy(
        'SnobS3D YakAdapter',
        curvelikePools.snobS3D, 
        170000
    )
    adapters['SnobS4DAdapter'] = await CurveLikeAdapterFactory.connect(deployer).deploy(
        'SnobS4D YakAdapter',
        curvelikePools.snobS4D, 
        180000
    )
    adapters['GondolaDAIAdapter'] = await CurveLikeAdapterFactory.connect(deployer).deploy(
        'GondolaDAI YakAdapter',
        curvelikePools.GondolaDAI, 
        150000
    )
    adapters['GondolaBTCAdapter'] = await CurveLikeAdapterFactory.connect(deployer).deploy(
        'GondolaBTC YakAdapter',
        curvelikePools.GondolaBTC, 
        150000
    )
    adapters['GondolaUSDTAdapter'] = await CurveLikeAdapterFactory.connect(deployer).deploy(
        'GondolaUSDT YakAdapter',
        curvelikePools.GondolaUSDT, 
        150000
    )
    adapters['GondolaETHAdapter'] = await CurveLikeAdapterFactory.connect(deployer).deploy(
        'GondolaETH YakAdapter',
        curvelikePools.GondolaETH, 
        150000
    )
    adapters['GondolaUSDTeUSDCeAdapter'] = await CurveLikeAdapterFactory.connect(deployer).deploy(
        'GondolaUSDTeUSDCe YakAdapter',
        curvelikePools.GondolaUSDTeUSDCe, 
        150000
    )
    adapters['GondolaUSDTeTSDAdapter'] = await CurveLikeAdapterFactory.connect(deployer).deploy(
        'GondolaUSDTeTSD YakAdapter',
        curvelikePools.GondolaUSDTeTSD, 
        150000
    )
    adapters['GondolaUSDTUSDTeAdapter'] = await CurveLikeAdapterFactory.connect(deployer).deploy(
        'GondolaUSDTUSDTe YakAdapter',
        curvelikePools.GondolaUSDTUSDTe, 
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
    adapters['JoeAdapter'] = await UnilikeAdapterFactory.connect(deployer).deploy(
        'Joe YakAdapter',
        unilikeFactories.joe,
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
const _miniYakAdapter = async () => {
    const gasCost = 81000
    const [ deployer ] = await ethers.getSigners()
    const adapterFactory = await ethers.getContractFactory('MiniYakAdapter')
    const adapter = await adapterFactory.connect(deployer).deploy(gasCost)
    const tkns = {}
    tkns['YAK'] = await helpers.getTokenContract(assets.YAK)
    tkns['mYAK'] = await helpers.getTokenContract(assets.mYAK)
    // Set tags
    if (TRACER_ENABLED) {
        hre.tracer.nameTags['deployer'] = deployer
        hre.tracer.nameTags[adapter.address] = 'MiniYakAdapter'
        for (key in tkns) {
            hre.tracer.nameTags[tkns[key].address] = key
        }
    }
    return {
        adapterFactory, 
        adapter,
        tkns
    }
}

const simple = deployments.createFixture(async () => {
    // Get token contracts
    const tokenContracts = await Promise.all(Object.keys(assets).map(tknSymbol => {
        return helpers.getTokenContract(assets[tknSymbol]).then(tc => [tknSymbol, tc])
    })).then(Object.fromEntries)
    // Get accounts
    const genNewAccount = await helpers.makeAccountGen()
    return { genNewAccount, tokenContracts }
})

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
    const LydiaRouter = await ethers.getContractAt('IUnilikeAVAXRouter', unilikeRouters.lydia)
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
        LydiaRouter,
        ZeroRouter,
        deployer,
        U256_MAX,
        assets,
        ZERO
    }
})

const axialAdapter = deployments.createFixture(_axialAdapter)
const curveAdapter = deployments.createFixture(_curveAdapter)
const miniYakAdapter = deployments.createFixture(_miniYakAdapter)
const synapseAdapter = deployments.createFixture(_synapseAdapter)
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
    synapseAdapter,
    miniYakAdapter,
    curveAdapter,
    axialAdapter,
    general, 
    simple,
    router
}
