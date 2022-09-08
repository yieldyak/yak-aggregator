const { deployments, ethers } = require("hardhat")
const helpers = require('./helpers')
const addresses = require('../misc/addresses.json')
const constants = require('../misc/constants.json')

TRACER_ENABLED = process.argv.includes('--logs')
const { 
    balancerlikeVaults, 
    balancerlikePools, 
    unilikeFactories, 
    curvelikePools, 
    unilikeRouters, 
    assets, 
    other 
} = addresses.avalanche
let ADAPTERS = {}

const _dummyMaintainable = async () => {
  const [deployer] = await ethers.getSigners();
  const DummyMaintainable = await ethers
    .getContractFactory("DummyMaintainable")
    .then((f) => f.connect(deployer).deploy());
  return {
    DummyMaintainable,
    deployer,
  };
};

const _geodeWPAdapter = async () => {
    const [ deployer ] = await ethers.getSigners()
    const GeodeWPAdapterFactory = ethers.getContractFactory('GeodeWPAdapter')
    const [
        gAVAX,
        GeodeWP,
        GeodeWPAdapter
    ] = await Promise.all([
        ethers.getContractAt('IgAVAX', assets.gAVAX),
        ethers.getContractAt('IGeodeWP', other.GWPyyAvax),
        GeodeWPAdapterFactory.then(f => f.connect(deployer).deploy(
            'GWPyyAvaxAdapter',
            other.GeodePortal,
            constants.geode.yyPlanet,
            4.3e5
        ))
    ])
    return {
        GeodeWPAdapter,
        GeodeWP,
        gAVAX,
        deployer,
    }
}

const _platypusAdapter = async () => {
    const [ deployer ] = await ethers.getSigners()
    const PlatypusAdapter = await ethers.getContractFactory('PlatypusAdapter')
        .then(f => f.connect(deployer).deploy('PlatypusAdapter', 5e5))
    return {
        PlatypusAdapter, 
        deployer
    }
}

const _woofiAdapter = async () => {
    const WoofiAdapterFactory = ethers.getContractFactory('WoofiAdapter')
    const [
        WoofiPool,
        WoofiAdapter
    ] = await Promise.all([
        ethers.getContractAt('IWooPP', other.WoofiPoolUSDC),
        WoofiAdapterFactory.then(f => f.deploy(
            'WoofiAdapter', 
            5.25e5,
            other.WoofiPoolUSDC
        ))
    ])
    return {
        WoofiAdapter,
        WoofiPool
    }
}

const _savaxAdapter = async () => {
    const SAvaxAdapterFactory = ethers.getContractFactory('SAvaxAdapter')
    const [
        SAVAX,
        SAvaxAdapter
    ] = await Promise.all([
        ethers.getContractAt('ISAVAX', assets.SAVAX),
        SAvaxAdapterFactory.then(f => f.deploy(1.7e5))
    ])
    return {
        SAvaxAdapter,
        SAVAX
    }
}

const _gmxAdapter = async () => {
    const GmxAdapterFactory = ethers.getContractFactory('GmxAdapter')
    const [
        GmxVault,
        GmxAdapterV0
    ] = await Promise.all([
        ethers.getContractAt('IGmxVault', other.GmxVault),
        GmxAdapterFactory.then(f => f.deploy(
            'GmxAdapterV0', 
            other.GmxVault,
            6.32e5
        ))
    ])
    return {
        GmxAdapterV0,
        GmxVault
    }
}

const _arableAdapter = async () => {
    const ArableAdapterFactory = ethers.getContractFactory('ArableSFAdapter')
    const [
        ArableSF,
        ArableAdapterV0
    ] = await Promise.all([
        ethers.getContractAt('IStabilityFund', other.ArableSF),
        ArableAdapterFactory.then(f => f.deploy(
            'ArableAdapterV0', 
            other.ArableSF,
            2.35e5
        )).catch(err => console.log(err))
    ])
    return {
        ArableAdapterV0,
        ArableSF
    }
}

const _xjoeAdapter = async () => {
    const XJoeAdapterFactory = ethers.getContractFactory('XJoeAdapter')
    const [
        XJoe,
        XJoeAdapter
    ] = await Promise.all([
        ethers.getContractAt('IxJOE', assets.xJOE),
        XJoeAdapterFactory.then(f => f.deploy(1.5e5))
    ])
    return {
        XJoeAdapter,
        XJoe
    }
}

const _kyberAdapter = async () => {
    const KyberAdapterFactory = ethers.getContractFactory('KyberAdapter')
    const [
        KyberRouter,
        KyberAdapter
    ] = await Promise.all([
        ethers.getContractAt('IKyberRouter', unilikeRouters.kyber),
        KyberAdapterFactory.then(f => f.deploy(
            'KyberAdapter',
            [
                '0xe1dad9e06380bc8962e259ddd6a5257a4f56d525',  // USDTe-USDCe
                '0x5f1b43d6056898c1573026955a2516ee5329630b',  // MIM-USDCe
                '0x85659e7f611add6c0cc95c90249d9db54071ca2e',  // MIM-USDTe
                '0x44d1b2974b3b8ce93b261f6d15dce5ad57f8933b',  // DYP-WAVAX
                '0x0f0fc5a5029e3d155708356b422d22cc29f8b3d4',  // WETHe-WAVAX
                '0xb34068e28a7853123afafc936c972123eb9895a2',  // XAVA-WAVAX
                '0x535a99a079d64b8c3f4cc264eba70d82992b224b',  // APEIN-WAVAX
            ],  // Supported pools
            1.82e5  // Gas cost
        ))
    ])
    return {
        KyberRouter,
        KyberAdapter
    }
}

const _curveAdapter = async () => {
    const Curve1AdaptorFactory = ethers.getContractFactory('Curve1Adapter')
    const Curve2AdaptorFactory = ethers.getContractFactory('Curve2Adapter')
    const CurvePlain128AdapterFactory = ethers.getContractFactory('CurvePlain128Adapter')
    const CurveMimAdapterFactory = ethers.getContractFactory('CurveMimAdapter')
    const CurveMoreAdapterFactory = ethers.getContractFactory('CurveMoreAdapter')
    const CurveDeUSDCAdapterFactory = ethers.getContractFactory('CurveDeUSDCAdapter')
    const [ 
        CurveAave,
        CurveAtricrypto,
        CurveRen,
        Curve3poolV2,
        CurveUSDC,
        Curve3poolf,
        CurveYUSD,
        CurveMim,
        CurveMorePool,
        CurveDeUSDCPool,
        CurveAaveAdapter,
        CurveAtricryptoAdapter, 
        CurveRenAdapter, 
        Curve3poolV2Adapter,
        CurveUSDCAdapter,
        Curve3poolfAdapter,
        CurveYUSDAdapter,
        CurveMimAdapter,
        CurveMoreAdapter,
        CurveDeUSDCAdapter
    ] = await Promise.all([
        ethers.getContractAt('ICurve2', curvelikePools.CurveAave),
        ethers.getContractAt('ICurve1', curvelikePools.CurveAtricrypto),
        ethers.getContractAt('ICurve2', curvelikePools.CurveRen),
        ethers.getContractAt('CurvePlain128', curvelikePools.Curve3poolV2),
        ethers.getContractAt('CurvePlain128', curvelikePools.CurveUSDC),
        ethers.getContractAt('CurvePlain128', curvelikePools.Curve3poolf),
        ethers.getContractAt('CurvePlain128', curvelikePools.CurveYUSD),
        ethers.getContractAt('ICurveMim', curvelikePools.CurveMim),
        ethers.getContractAt('ICurve2', curvelikePools.CurveMore),
        ethers.getContractAt('ICurveMim', curvelikePools.CurveDeUSDC),
        Curve2AdaptorFactory.then(f => f.deploy('CurveAaveAdapter', curvelikePools.CurveAave, 7.7e5)),
        Curve1AdaptorFactory.then(f => f.deploy('CurveAtricryptoAdapter', curvelikePools.CurveAtricrypto, 9.5e5)),
        Curve2AdaptorFactory.then(f => f.deploy('CurveRenAdapter', curvelikePools.CurveRen, 5.3e5)),
        CurvePlain128AdapterFactory.then(f => f.deploy('Curve3poolV2Adapter', curvelikePools.Curve3poolV2, 2.5e5)),
        CurvePlain128AdapterFactory.then(f => f.deploy('CurveUSDCAdapter', curvelikePools.CurveUSDC, 2.5e5)),
        CurvePlain128AdapterFactory.then(f => f.deploy('Curve3poolfAdapter', curvelikePools.Curve3poolf, 2.9e5)),
        CurvePlain128AdapterFactory.then(f => f.deploy('CurveYUSDAdapter', curvelikePools.CurveYUSD, 2.8e5)),
        CurveMimAdapterFactory.then(f => f.deploy('CurveMimAdapter', 1.1e6)),
        CurveMoreAdapterFactory.then(f => f.deploy('CurveMoreAdapter', 1.1e6)),
        CurveDeUSDCAdapterFactory.then(f => f.deploy('CurveDeUSDCAdapter', 1.1e6))
    ])
    return { 
        CurveAave,
        CurveAtricrypto,
        CurveRen,
        Curve3poolV2,
        CurveUSDC,
        Curve3poolf,
        CurveYUSD,
        CurveMim,
        CurveMorePool,
        CurveDeUSDCPool,
        CurveAaveAdapter,
        CurveAtricryptoAdapter, 
        CurveRenAdapter, 
        Curve3poolV2Adapter, 
        CurveUSDCAdapter,
        Curve3poolfAdapter,
        CurveYUSDAdapter, 
        CurveMimAdapter,
        CurveMoreAdapter,
        CurveDeUSDCAdapter
    }
}

const _axialAdapter = async () => {
    const SaddleMetaAdapterFactory = ethers.getContractFactory('SaddleMetaAdapter')
    const SaddleAdapterFactory = ethers.getContractFactory('SaddleAdapter')
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
        ethers.getContractAt('ISaddleMeta', curvelikePools.AxialAM3DUSDC),
        ethers.getContractAt('ISaddle', curvelikePools.AxialAM3D),
        ethers.getContractAt('ISaddle', curvelikePools.AxialAC4D),
        ethers.getContractAt('ISaddle', curvelikePools.AxialAA3D),
        ethers.getContractAt('ISaddle', curvelikePools.AxialAS4D),
        SaddleMetaAdapterFactory.then(f => f.deploy(
            'AxialAM3DUSDCAdapter',
            curvelikePools.AxialAM3DUSDC,
            6.5e5
        )),
        SaddleAdapterFactory.then(f => f.deploy(
            'AxialAM3DAdapter',
            curvelikePools.AxialAM3D,
            3.7e5
        )),
        SaddleAdapterFactory.then(f => f.deploy(
            'AxialAC4DAdapter',
            curvelikePools.AxialAC4D,
            3.6e5
        )),
        SaddleAdapterFactory.then(f => f.deploy(
            'AxialAA3DAdapter',
            curvelikePools.AxialAA3D,
            4e5
        )),
        SaddleAdapterFactory.then(f => f.deploy(
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
    const CurvelikeAdapterFactory = ethers.getContractFactory('SaddleAdapter')
    const [
        SynapsePool, 
        SynapseAdapter
    ] = await Promise.all([
        ethers.getContractAt('ISaddle', curvelikePools.SynapseDAIeUSDCeUSDTeNUSD),
        CurvelikeAdapterFactory.then(f => f.deploy(
            'Synapse YakAdapter',
            curvelikePools.SynapseDAIeUSDCeUSDTeNUSD, 
            3.2e5
        ))
    ])
    return {
        SynapseAdapter,
        SynapsePool
    }
}

const _curvelikeAdapters = async () => {
    const [ deployer ] = await ethers.getSigners()
    // Import live contracts
    const pools = {
        GondolaUSDTUSDTe: await ethers.getContractAt('ISaddle', curvelikePools.GondolaUSDTUSDTe),
        GondolaUSDTeUSDCe: await ethers.getContractAt('ISaddle', curvelikePools.GondolaUSDTeUSDCe),
        GondolaUSDTeTSD: await ethers.getContractAt('ISaddle', curvelikePools.GondolaUSDTeTSD),
        GondolaUSDT: await ethers.getContractAt('ISaddle', curvelikePools.GondolaUSDT),
        GondolaDAI: await ethers.getContractAt('ISaddle', curvelikePools.GondolaDAI),
        GondolaBTC: await ethers.getContractAt('ISaddle', curvelikePools.GondolaBTC),
        GondolaETH: await ethers.getContractAt('ISaddle', curvelikePools.GondolaETH),
        SnobF3D: await ethers.getContractAt('ISaddle', curvelikePools.snobF3D),
        SnobS3D: await ethers.getContractAt('ISaddle', curvelikePools.snobS3D),
        SnobS4D: await ethers.getContractAt('ISaddle', curvelikePools.snobS4D),
    }
    // Init Adapters
    const adapters = {}
    const  SaddleAdapterFactory = await ethers.getContractFactory('SaddleAdapter')
    adapters['SnobF3DAdapter'] = await SaddleAdapterFactory.connect(deployer).deploy(
        'SnobF3D YakAdapter',
        curvelikePools.snobF3D, 
        170000
    )
    adapters['SnobS3DAdapter'] = await SaddleAdapterFactory.connect(deployer).deploy(
        'SnobS3D YakAdapter',
        curvelikePools.snobS3D, 
        170000
    )
    adapters['SnobS4DAdapter'] = await SaddleAdapterFactory.connect(deployer).deploy(
        'SnobS4D YakAdapter',
        curvelikePools.snobS4D, 
        180000
    )
    adapters['GondolaDAIAdapter'] = await SaddleAdapterFactory.connect(deployer).deploy(
        'GondolaDAI YakAdapter',
        curvelikePools.GondolaDAI, 
        150000
    )
    adapters['GondolaBTCAdapter'] = await SaddleAdapterFactory.connect(deployer).deploy(
        'GondolaBTC YakAdapter',
        curvelikePools.GondolaBTC, 
        150000
    )
    adapters['GondolaUSDTAdapter'] = await SaddleAdapterFactory.connect(deployer).deploy(
        'GondolaUSDT YakAdapter',
        curvelikePools.GondolaUSDT, 
        150000
    )
    adapters['GondolaETHAdapter'] = await SaddleAdapterFactory.connect(deployer).deploy(
        'GondolaETH YakAdapter',
        curvelikePools.GondolaETH, 
        150000
    )
    adapters['GondolaUSDTeUSDCeAdapter'] = await SaddleAdapterFactory.connect(deployer).deploy(
        'GondolaUSDTeUSDCe YakAdapter',
        curvelikePools.GondolaUSDTeUSDCe, 
        150000
    )
    adapters['GondolaUSDTeTSDAdapter'] = await SaddleAdapterFactory.connect(deployer).deploy(
        'GondolaUSDTeTSD YakAdapter',
        curvelikePools.GondolaUSDTeTSD, 
        150000
    )
    adapters['GondolaUSDTUSDTeAdapter'] = await SaddleAdapterFactory.connect(deployer).deploy(
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
        SaddleAdapterFactory,
        adapters, 
        pools,
    }
}

const _balancerlikeAdapters = async () => {
    const [ deployer ] = await ethers.getSigners()
    const BalancerlikeAdapterFactory = await ethers.getContractFactory('BalancerlikeAdapter')
    const [
        EmbrVault,
        EmbrAUSDWAVAX,
        EmbrUSDCUSDCeWAVAX,
        EmbrAUSDAVE,
        EmbrAdapter,
    ] = await Promise.all([
        ethers.getContractAt('IVault', balancerlikeVaults.embr),
        ethers.getContractAt('IBasePool', balancerlikePools.embrAUSDWAVAX),
        ethers.getContractAt('IBasePool', balancerlikePools.embrUSDCUSDCeWAVAX),
        ethers.getContractAt('IBasePool', balancerlikePools.embrAUSDAVE),
        BalancerlikeAdapterFactory.connect(deployer).deploy(
            'Embr YakAdapter', 
            balancerlikeVaults.embr,
            Object.values(balancerlikePools),
            258000),   
    ])
    return {
        EmbrVault,
        EmbrAUSDWAVAX,
        EmbrUSDCUSDCeWAVAX,
        EmbrAUSDAVE,
        EmbrAdapter,
    }
}

const _unilikeAdapters = async () => {
    const [ deployer ] = await ethers.getSigners()
    const adapters = {}
    const UniswapV2AdapterFactory = await ethers.getContractFactory('UniswapV2Adapter')
    adapters['ElkAdapter'] = await UniswapV2AdapterFactory.connect(deployer).deploy(
        'Elk YakAdapter',
        unilikeFactories.elk,
        3,
        100000
    )
    adapters['PandaAdapter'] = await UniswapV2AdapterFactory.connect(deployer).deploy(
        'PandaSwap YakAdapter',
        unilikeFactories.pandaswap,
        3,
        100000
    )
    adapters['OliveAdapter'] = await UniswapV2AdapterFactory.connect(deployer).deploy(
        'OliveSwap YakAdapter',
        unilikeFactories.olive,
        2,
        100000
    )
    adapters['SushiswapAdapter'] = await UniswapV2AdapterFactory.connect(deployer).deploy(
        'Sushiswap YakAdapter',
        unilikeFactories.sushiswap,
        3,
        100000
    )
    adapters['ComplusAdapter'] = await UniswapV2AdapterFactory.connect(deployer).deploy(
        'Complus YakAdapter',
        unilikeFactories.complus,
        3,
        100000
    )
    adapters['ZeroAdapter'] = await UniswapV2AdapterFactory.connect(deployer).deploy(
        'Zero YakAdapter',
        unilikeFactories.zero,
        3,
        100000
    )
    adapters['PangolinAdapter'] = await UniswapV2AdapterFactory.connect(deployer).deploy(
        'Pangolin YakAdapter',
        unilikeFactories.pangolin,
        3,
        100000
    )
    adapters['LydiaAdapter'] = await UniswapV2AdapterFactory.connect(deployer).deploy(
        'Lydia YakAdapter',
        unilikeFactories.lydia,
        2,
        100000
    )
    adapters['YetiAdapter'] = await UniswapV2AdapterFactory.connect(deployer).deploy(
        'Yeti YakAdapter',
        unilikeFactories.yeti,
        3,
        100000
    )
    adapters['JoeAdapter'] = await UniswapV2AdapterFactory.connect(deployer).deploy(
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
        UniswapV2AdapterFactory, 
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
        balancerlikePools,
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

const dummyMaintainable = deployments.createFixture(_dummyMaintainable);
const geodeWPAdapter = deployments.createFixture(_geodeWPAdapter)
const woofiAdapter = deployments.createFixture(_woofiAdapter)
const savaxAdapter = deployments.createFixture(_savaxAdapter)
const gmxAdapter = deployments.createFixture(_gmxAdapter)
const arableAdapter = deployments.createFixture(_arableAdapter)
const xjoeAdapter = deployments.createFixture(_xjoeAdapter)
const kyberAdapter = deployments.createFixture(_kyberAdapter)
const platypusAdapter = deployments.createFixture(_platypusAdapter)
const axialAdapter = deployments.createFixture(_axialAdapter)
const curveAdapter = deployments.createFixture(_curveAdapter)
const miniYakAdapter = deployments.createFixture(_miniYakAdapter)
const synapseAdapter = deployments.createFixture(_synapseAdapter)
const unilikeAdapters = deployments.createFixture(_unilikeAdapters)
const curvelikeAdapters = deployments.createFixture(_curvelikeAdapters)
const balancerlikeAdapters = deployments.createFixture(_balancerlikeAdapters)
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
        deployer.address, 
        assets.WAVAX
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
    helpers,
    constants,
    addresses,
    fixtures: {
        curvelikeAdapters, 
        balancerlikeAdapters,
        platypusAdapter,
        unilikeAdapters,
        bridgeMigration,
        synapseAdapter,
        miniYakAdapter,
        geodeWPAdapter,
        savaxAdapter,
        curveAdapter,
        axialAdapter,
        kyberAdapter,
        woofiAdapter,
        xjoeAdapter,
        gmxAdapter,
        arableAdapter,
        general, 
        simple,
        router,
	dummyMaintainable
    }
}
