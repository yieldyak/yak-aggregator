const { 
    avalanche: ava, 
    dogechain: dog
} = require('./addresses.json')

module.exports = {
    "avalanche": {
        adapterWhitelist: [
            'TraderJoeAdapter',
            'PangolinAdapter',
            'SushiswapAdapter',
      
            'SynapseAdapter',
            'AxialAS4DAdapter',
            'PlatypusAdapter',
            
            'CurveAtricryptoAdapter',
            'Curve3poolV2Adapter',
            'Curve3poolfAdapter',
            'CurveAaveAdapter',
            'CurveUSDCAdapter',
            'CurveYUSDAdapter',
            
            'LiquidityBookAdapter',
            'KyberElasticAdapter',
            'WoofiV2Adapter',
            'GeodeWPAdapter',
            'GmxAdapter',
            
            'SAvaxAdapter',
            'WAvaxAdapter',
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
    }
}