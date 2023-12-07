const { 
    avalanche: ava, 
    dogechain: dog, 
    arbitrum: arb,
    optimism: opt,
    base: base
} = require('./addresses.json')

module.exports = {
    "avalanche": {
        adapterWhitelist: [
            'TraderJoeAdapter',
            'PangolinAdapter',
            'SushiswapAdapter',
            'GlacierAdapter',
            // 'SolisnekAdapter',
      
            'SynapseAdapter',
            'AxialAS4DAdapter',
            // 'PlatypusAdapter',
            
            'CurveAtricryptoAdapter',
            'Curve3poolV2Adapter',
            'Curve3poolfAdapter',
            'CurveAaveAdapter',
            'CurveUSDCAdapter',
            'CurveYUSDAdapter',
            
            'UniswapV3Adapter',
            'LiquidityBook2Adapter',
            // 'LiquidityBookAdapter',
            // 'KyberElasticAdapter',
            'WoofiV2Adapter',
            'GeodeWPAdapter',
            'GmxAdapter',
            
            'SAvaxAdapter',
            'WAvaxAdapter',
            'WombatAdapter',
            'ReservoirAdapter',
        ],
        minimalAdapterWhitelist: [
            'WAvaxAdapter',
            'TraderJoeAdapter',            
            'LiquidityBookAdapter',
            'KyberElasticAdapter',
            'GmxAdapter',
        ],
        hopTokens: [
            ava.assets.WAVAX,
            ava.assets.WETHe,
            ava.assets.USDTe,
            ava.assets.USDC,
            ava.assets.USDCe,
            ava.assets.WBTCe,
            ava.assets.DAIe,
            ava.assets.USDt,
          ],
        wnative: ava.assets.WAVAX
    }, 
    "dogechain": {
        adapterWhitelist: [
            'DogeSwapAdapter',
            'KibbleSwapAdapter',
            'YodeSwapAdapter',
            'QuickswapAdapter'
        ],
        hopTokens: [
            dog.assets.ETH,
            dog.assets.USDC,
            dog.assets.USDT,
            dog.assets.WWDOGE,
        ], 
        wnative: dog.assets.WWDOGE
    },
    "arbitrum": {
        adapterWhitelist: [
            'BalancerV2Adapter',
            'Curve3cryptoAdapter',
            'Curve2stableAdapter',
            'CurveFraxVstAdapter',
            'CurveFraxBpAdapter',
            'CurveMetaAdapter',
            'DodoV1Adapter',
            'DodoV2Adapter',
            'GmxAdapter',
            'SaddleArbUsdAdapter',
            'SaddleArbUsdV2Adapter',
            'SushiswapAdapter',
            'SwaprAdapter',
            'UniswapV3Adapter',
            'LiquidityBook2Adapter',
            'LiquidityBookAdapter',
            'KyberElasticAdapter',
            'WoofiV2Adapter',
            'OreoswapAdapter',
            'CamelotAdapter',
            'WETHAdapter',
            // 'CamelotAlgebraAdapter',
            // 'ArbiDexAdapter',
        ],
        hopTokens: [
            arb.assets.WETH,
            arb.assets.WBTC,
            arb.assets.USDC,
            arb.assets.USDT,
            arb.assets.DAI,
        ], 
        wnative: arb.assets.WETH
    },
    "optimism": {
        adapterWhitelist: [
            'BeethovenxAdapter',
            'CurveMetaSUSDCRVAdapter',
            'CurveSethAdapter',
            'Curve3stableAdapter',
            'CurveWstethAdapter',
            
            'SaddleFraxBPAdapter',
            'SaddleMetaFraxAdapter',
            'SaddleMetaSUSDAdapter',
            'SaddleOptUsdAdapter',
            
            'KyberElasticAdapter',
            'ZipswapAdapter',
            'UniswapV3Adapter',
            'VelodromeAdapter',
            'WoofiV2Adapter',
        ],
        hopTokens: [
            opt.assets.WETH,
            opt.assets.WBTC,
            opt.assets.USDC,
            opt.assets.USDT,
            opt.assets.DAI,
            opt.assets.OP, 
            opt.assets.wstETH,
            opt.assets.sETH, 
            // opt.assets.MAI, 
            // opt.assets.KNC, 
            // opt.assets.BOB, 
        ], 
        wnative: opt.assets.WETH
    },
    "base": {
        adapterWhitelist: [
            'AlienBaseAdapter',
            'BaseSwapAdapter',
            'SwapBasedAdapter',
            'UniswapV3Adapter',
            'SushiV3Adapter',
            'AerodromAdapter'
        ],
        hopTokens: [
            base.assets.ETH,
            base.assets.axlUSDC,
            base.assets.USDbC,
            base.assets.DAI,
            base.assets["USD+"],
            base.assets["DAI+"]
        ], 
        wnative: base.assets.ETH
    }
}