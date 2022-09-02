const { assets } = require('./addresses.json').avalanche

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
            assets.WAVAX,
            assets.WETHe,
            assets.USDTe,
            assets.USDC,
            assets.USDCe,
            assets.MIM,
            assets.WBTCe,
            assets.DAIe,
            assets.USDt,
          ],
        wnative: assets.WAVAX
    }
}