const { 
    avalanche: ava, 
    dogechain: dog
} = require('./addresses.json')

module.exports = {
    "avalanche": {
        adapterWhitelist: [
            'TraderJoeYakAdapterV0',
            'PangolinYakAdapterV0',
            'SushiYakAdapterV0',
            'ElkYakAdapterV0',
            'KyberAdapter',
      
            'SynapsePlainYakAdapterV0',
            'AxialAS4DYakAdapterV0',
            'PlatypusYakAdapterV2',
            
            'CurveAtricryptoAdapterV0',
            'Curve3poolV2AdapterV0',
            'Curve3poolfAdapterV0',
            'CurveDeUSDCAdapterV0',
            'CurveAaveAdapterV0',
            'CurveUSDCAdapterV0',
            'CurveMoreAdapterV0',
            'CurveRenAdapterV0',
            'CurveYUSDAdapter',
      
            'WoofiUSDCAdapter',
            'GWPyyAvaxAdapter',
            'ArableAdapter',
            'GmxAdapterV0',
            
            'MiniYakAdapterV0',
            'SAvaxAdapterV0',
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