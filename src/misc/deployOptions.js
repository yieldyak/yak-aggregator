const { 
    avalanche: ava, 
    dogechain: dog
} = require('./addresses.json')

module.exports = {
    "avalanche": {
        adapterWhitelist: [
            'TraderjoeAdapter',
            'PangolinAdapter',
            'SushiswapAdapter',
            'KyberAdapter',
      
            'SynapseAdapter',
            'AxialAS4DAdapter',
            'PlatypusAdapter',
            
            'CurveAtricryptoAdapter',
            'Curve3poolV2Adapter',
            'Curve3poolfAdapter',
            'CurveDeUSDCAdapter',
            'CurveAaveAdapter',
            'CurveUSDCAdapter',
            'CurveMoreAdapter',
            'CurveRenAdapter',
            'CurveYUSDAdapter',
      
            'WoofiAdapter',
            'GeodeWPAdapter',
            'ArableAdapter',
            'GmxAdapter',
            
            'MiniYakAdapter',
            'SAvaxAdapter',
            'WAvaxAdapter',
        ],
        hopTokens: [
            ava.assets.WAVAX,
            ava.assets.WETHe,
            ava.assets.USDTe,
            ava.assets.USDC,
            ava.assets.USDCe,
            ava.assets.MIM,
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