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
| GondolaDAIDAIeYakAdapterV0   | `0xB077DCB0a646657b0Ed2779aeB9B766e116501B0` |
| GondolaUSDTeDAIeYakAdapterV0   | `0xd31e50c4a9113a33a51695d0c18e8015AE3264A7` |
| GondolaUSDTUSDTeYakAdapterV0   | `0xbaB6aC1948C8D8Cfc65A4b7a9E7E7439cb70fF21` |
| GondolaWBTCrenBTCYakAdapterV0   | `0x88e46334DA243a9c607CF573b6A746178ed2610E` |
| GondolaWBTCWBTCeYakAdapterV0   | `0xEfC0e1088b6Fc7D4873491281f32BF04ba4e9ca7` |
| GondolaWETHWETHeYakAdapterV0   | `0x90EF37fc3a353254AEbb256f4Df457410d8a94F4` |
| GondolaUSDTeUSDCeYakAdapterV0   | `0xEfB72172e59fd2EFbb8107f39BCcfE0e05A0aF8F` |
| GondolaUSDTeTSDYakAdapterV0   | `0x265D1bdEF9f197B6063833C5bC191bAA309b2C63` |
| LydiaYakAdapterV0   | `0xe54EC09784F5Ee971254d288E34C8395d448C363` |
| OliveYakAdapterV0   | `0x38d8CDBfABC152B4B61DbA406c6cd29998527418` |
| PandaYakAdapterV0   | `0xBEf9AC2A46eAd1810599f75dA9967456d1739D09` |
| PangolinAdapter   | `0xe13D49ce2755D9537be62E0544AeC2878438994E` |
| SnobF3YakAdapterV0   | `0x086BB2eaAEac3f2fE9753806FdDA5d6d16497205` |
| SnobS3YakAdapterV0   | `0xb0eA2315093072397d03b0406f83D896dF3E8860` |
| SnobS4YakAdapterV0   | `0xBaab7B6a141E8e4159D7d4deAD8dC30014d75e84` |
| SushiswapAdapter   | `0xAD5ae6e5e4f4BE199528985A4e93065A4F22939e` |
| YetiYakAdapterV0   | `0x3A2e85e1d4aBa2EBDABcdF7F12e2B371687F6dfF` |
| ZeroYakAdapterV0   | `0x647A80d26ab387D813f5B8Fa1FC71DBD2A5aD178` |
| BaguetteYakAdapterV0   | `0xf4fbe2680C926d1ceD09e6e45b3b31853fD157a3` |
| CanaryYakAdapterV0   | `0x85b9ebbAC0669CA081892F5AEad7B835b472c054` |
| TraderJoeYakAdapterV0   | `0xD687165d50209E46f4355f1917F1D2B2d66fB9C9` |
| SynapseAdapterV0   | `0x364FD64a98bD60aA798Ea8c61bb30d404102E900` |

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
