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
| YakRouter   | `0x187Cd11549a20ACdABd43992d01bfcF2Bfc3E18d` |

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
| ComplusAdapterV0   | `0x2B5eff8AaD9c48E48F9A22e4F86d6A831d029355` |
| ElkYakAdapterV0   | `0x1F1B88608D475691b69bEb5216A0158F5a338a37` |
| GondolaDAIDAIeYakAdapterV0   | `0xA2828faE51f2140a5cbAB4C683c25eEf58363106` |
| GondolaUSDTeDAIeYakAdapterV0   | `0x0B1A87884D8D8bC7360A0268609D85B17E88b367` |
| GondolaUSDTUSDTeYakAdapterV0   | `0x12A4901C67fAa2CA37D257d49Ba33B7de1074DE8` |
| GondolaWBTCrenBTCYakAdapterV0   | `0xa5A9B0Ca7a815BB4035fd6e03b5f0B43e8D7E909` |
| GondolaWBTCWBTCeYakAdapterV0   | `0x893956B6B8b90536d5Baa76dD9390b72c15E2149` |
| GondolaWETHWETHeYakAdapterV0   | `0x235c1B7BFb441cccF0e755aE9e2fF5F9B22995AD` |
| LydiaYakAdapterV0   | `0xe54EC09784F5Ee971254d288E34C8395d448C363` |
| OliveYakAdapterV0   | `0x38d8CDBfABC152B4B61DbA406c6cd29998527418` |
| PandaYakAdapterV0   | `0xBEf9AC2A46eAd1810599f75dA9967456d1739D09` |
| PangolinAdapter   | `0xe13D49ce2755D9537be62E0544AeC2878438994E` |
| SnobF3YakAdapterV0   | `0x681EBc3DDE781935847D5981a7AB0482653bf558` |
| SnobS3YakAdapterV0   | `0x2F4463a81Cb1cc0d9305eAc461077490e1756714` |
| SnobS4YakAdapterV0   | `0x66DeacAbFaB3398EBC5Aae19Af9F8196E8B43294` |
| SushiswapAdapter   | `0xAD5ae6e5e4f4BE199528985A4e93065A4F22939e` |
| YetiYakAdapterV0   | `0x3A2e85e1d4aBa2EBDABcdF7F12e2B371687F6dfF` |
| ZeroYakAdapterV0   | `0x647A80d26ab387D813f5B8Fa1FC71DBD2A5aD178` |
| BaguetteYakAdapterV0   | `0xf4fbe2680C926d1ceD09e6e45b3b31853fD157a3` |
| CanaryYakAdapterV0   | `0x85b9ebbAC0669CA081892F5AEad7B835b472c054` |
| TraderJoeYakAdapterV0   | `0xD687165d50209E46f4355f1917F1D2B2d66fB9C9` |

## Local Development and testing

### Install Dependencies

```
npm i -D
```

### Set Environmental Variables

```
cp .env.sample > .env
```

### Deployment

```
npx hardhat deploy --network {your network}
```

### Run Tests

```
npx hardhat test
```

## Audits and Security

This project is in alpha stage and is unaudited. Use at your own risk. Report bugs to [Telegram admins](https://t.me/yieldyak)

---

Project is licensed under GPL-3, although some parts of it might be less restrictive.
Copyright© 2021 Yield Yak
