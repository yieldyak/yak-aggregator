const { assets } = require('./addresses.json')

module.exports = {
    "avalanche": {
        adapterWhitelist: [
            'TraderJoeYakAdapterV0',
            'PangolinYakAdapterV0',
            'SushiYakAdapterV0',
            'LydiaYakAdapterV0',
            'HakuSwapAdapterV0',
            'ElkYakAdapterV0',
            'KyberAdapter',
      
            'SynapsePlainYakAdapterV0',
            'PlatypusYakAdapterV2',
            
            'CurveAtricryptoAdapterV',
            'Curve3poolV2AdapterV0',
            'Curve3poolfAdapterV0',
            'CurveDeUSDCAdapterV0',
            'CurveAaveAdapterV0',
            'CurveUSDCAdapterV0',
            'CurveMoreAdapterV0',
            'CurveRenAdapterV0',
            'CurveYUSDAdapter',
            
            'AxialAS4DYakAdapterV0',
            'AxialAM3DYakAdapterV0',
            'AxialAA3DYakAdapterV0',
            'AxialAC4DYakAdapterV0',
      
            'WoofiUSDCAdapter',
            'GWPyyAvaxAdapter',
            'ArableAdapter',
            'GmxAdapterV0',
            
            'MiniYakAdapterV0',
            'SAvaxAdapterV0',
            'WAvaxAdapter',
            'XJoeAdapter',
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
            assets.JOE, // Needed to swap WAVAX to yyJOE
          ],
        wnative: assets.WAVAX
    }
}