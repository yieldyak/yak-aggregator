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
| YakRouter   | `0xC81904C7af58Df244B874fDCad1b72059d59EBb9` |

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
| ComplusAdapterV0   | `0x81544aCDBcFfdc9c0A265CFB220408E1E85AA43D` |
| ElkYakAdapterV0   | `0x233f1725116d514400127Fd2E458fB5555bE03D1` |
| GondolaBTCYakAdapterV0   | `0x50F9F913590e1dc0efC822e0552EbcBa5882e5dC` |
| GondolaDAIYakAdapterV0   | `0xe483B8C8ab7659FbaA2603B963bdA50FB1a8103C` |
| GondolaETHYakAdapterV0   | `0x9F7e365a57c6baeae94870ffbb0aF92209a9f4d0` |
| GondolaUSDTYakAdapterV0   | `0x24eD3cd5C29c9Ba7AAf9779D2055B8E38E16a29f` |
| LydiaYakAdapterV0   | `0x9D609aD3c673E2ddB3047C3F3B3efa2Ce14EB436` |
| OliveYakAdapterV0   | `0x1CA700e1b370182b2B44C884cBfA54ef60afc4d4` |
| PandaYakAdapterV0   | `0x19eb54ccB443aCED9dcbC960bA98064A13262Ef3` |
| PangolinAdapter   | `0x436029d1E240C7179a84326c4Cf4F3d2852FF40F` |
| SnobF3YakAdapterV0   | `0xDeDA699b533a1c6436B98D84D40a6724d377352d` |
| SnobS3YakAdapterV0   | `0xb32C79a25291265eF240Eb32E9faBbc6DcEE3cE3` |
| SushiswapAdapter   | `0x9d8D45Ad3388846e6F0062196e24df4c7654098b` |
| YetiYakAdapterV0   | `0x5eD59096EbB9C47C20D805a744a24EfDC3E982AB` |
| ZeroYakAdapterV0   | `0x11E68A3CE9A5A0F95ca9c4B0B8F17849752e24DD` |

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
