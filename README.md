## 🐃  YY Swap

Dex aggregator for Avalanche. Use at your own risk.

UI available from https://yieldyak.com/swap

## Overview

The Avalanche C-Chain is saturated with 10+ exchanges competing ~200M of liquidity. This creates the following issues for traders:
* **Split liquidity:**
Traders are more likely to get affected by price impact and negative slippage since liquidity is split across many exchanges.
* **Disconnected assets:**
Traders need to approve and swap on multiple platforms to swap between certain assets in the Avalanche ecosystem.
* **No simple way to determine best price for swap:**
With all the options there is no clear way of knowing which exchange will offer the best price for a particular trade. 

## How it works

YY Swap solves these problems by finding and executing the most profitable trades for users.
* Multi-path trades (e.g. Pangolin > Gondola > Zero)
* Gas-cost considerations
* Easy to build on top of

## Mainnet Deployments and Supported Platforms

### Routers

YakRouter is the user-facing interface to check prices and make trades.

| Name      | Address |
| ----------- | ----------- |
| YakRouter   | `0xC4729E56b831d74bBc18797e0e17A295fA77488c` |

#### Query

Query YakRouter for the best trade execution.

**Parameters**
 - **amountIn[BigNumber]:** Amount of tokens being sold
 - **tokenIn[String]:** ERC20 token being sold (pass WAVAX address for AVAX)
 - **tokenOut[String]:** ERC20 token being bought (pass WAVAX address for AVAX)
 - **steps[BigNumber]:** Number of steps within which best path will be searched (max is 4)
 - **gasPrice[BigNumber]:** Gas price in gwei (should be 225 GWEI now, but is planned be dynamic in the future)

###### findBestPathWithGas

```js
router.findBestPathWithGas(
    amountIn, 
    tokenIn, 
    tokenOut, 
    steps, 
    gasPrice
)
```

#### Swap

Swap YakRouter to execute a trade.

**Parameters**
 - **trade[Array]:** Array of paramters used for swapping
    - **amountIn[BigNumber]:** Amount of tokens being sold
    - **amountOut[BigNumber]:** Minimum amount of tokens bought
    - **path[Array]:** Tokens being traded (in respective order)
    - **adapters[Array]:** Adapters through which tokens will be traded (in respective order)
 - **to[String]:** Address where output tokens should be sent to
 - **fee[BigNumber]:** Optional fee in bps taken before the trades

###### swapNoSplit

```js
router.swapNoSplit(trade, to, fee)
```

###### swapNoSplitToAVAX

```js
router.swapNoSplitToAVAX(trade, to, fee);
```

###### swapNoSplitFromAVAX

```js
router.swapNoSplitFromAVAX(trade, to, fee, { value: amountIn });
```


### Adapters

Adapters act as a common interface for YakRouter to interact with external contracts.

Adapters must offer methods: `query` and `swap`. 

| Name      | Address |
| ----------- | ----------- |
| BaguetteYakAdapterV0 | `0x5BaCF41D5D6B16183c2B980BcE0FbbE5ea125d2F` |
| BridgeMigrationAdapterV0 | `0xd311F964Dd5bb5ecBd971592E845b0fb74c98b39` |
| BytesManipulationV0 | `0xdd892a0b5Bcfd435489e31D8e2ec9C9B83f85977` |
| CanaryYakAdapterV0 | `0x2BC16C1D9A5E6af362277ED424130cC6b2DDe2D9` |
| ComplusAdapterV0 | `0x273FcA9cd4C4873EFC303b0b61b5E5CB35CD9A70` |
| ElkYakAdapterV0 | `0xb2e51D2E2B85DbbE8C758C753b5BdA3f86Af05E4` |
| GondolaUSDTeDAIeYakAdapterV0 | `0xA5e0B490be8A2f8281e09d5920953c65e803a1DC` |
| GondolaUSDTeTSDAdapterV0 | `0x4884E64D9Ae8e00e9Da80f0B7791c998ac8828B7` |
| GondolaUSDTeUSDCeAdapterV0 | `0x2296706d53e6522942E8714Bdbc2e50625C5d4D4` |
| GondolaYAKmYAKAdapterV0 | `0x10EF2400d1a7f64017e80669B218f30ca9816e22` |
| LydiaYakAdapterV0 | `0x1276350e5855B2BCD089722a678C7D16f3ab5923` |
| MiniYakAdapterV0 | `0xC3BEe4623A7aE76Ca0805078e98069DEbF79E826` |
| OliveYakAdapterV0 | `0x6E73F353e4AE3E5005daaD619F22D7C7B790c4f3` |
| PandaYakAdapterV0 | `0x4E5a8D1EB5250c766AD55eE18314a76Fcb92A867` |
| PangolinYakAdapterV0 | `0x3614657EDc3cb90BA420E5f4F61679777e4974E3` |
| PartyswapAdapterV0 | `0xFE6BB940bE3F8e42ece2382EBb0A1Ea21eb1420d` |
| SnobF3YakAdapterV0 | `0x592E3D359E4A8Ed5f08f38806B1b7f70AA3DB4F2` |
| SnobS3YakAdapterV0 | `0x87E6989A7AB5C707608Fd6773Fe32413871F4C8e` |
| SnobS4YakAdapterV0 | `0x599610cf20379B5D21A4A3Ea84CB76E0F2a5f70f` |
| SushiYakAdapterV0 | `0x3f314530a4964acCA1f20dad2D35275C23Ed7F5d` |
| SynapseAdapterV0 | `0x364FD64a98bD60aA798Ea8c61bb30d404102E900` |
| TraderJoeYakAdapterV0 | `0xDB66686Ac8bEA67400CF9E5DD6c8849575B90148` |
| YakRouterV0 | `0xC4729E56b831d74bBc18797e0e17A295fA77488c` |
| YetiYakAdapterV0 | `0x9a76D67e67aE285856846C2Fa080adEcE60CfC9A` |
| ZeroYakAdapterV0 | `0x0EF5922f909374ccd7841a81F44ab109648b7ba5` |

## Local Development and testing

### Install Dependencies

```
npm i -D
```

### Set Environmental Variables

```
cp .env.sample > .env
```

### Run Tests

```
npx hardhat test
```

### Deployment

```
npx hardhat deploy --network {your network}
```

## Audits and Security

This project is in alpha stage and is unaudited. Use at your own risk. Report bugs to [Telegram admins](https://t.me/yieldyak)

---

Project is licensed under GPL-3, although some parts of it might be less restrictive.
Copyright© 2021 Yield Yak
