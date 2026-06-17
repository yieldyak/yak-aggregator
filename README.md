# [<img align="left" alt="Java" width="50px" src="https://github.com/yieldyak/brand-assets/blob/d6414e7e63a7e83b3d42376822a91f516cf325c4/y/y_400x400.png?raw=true" />](https://yieldyak.com/swap) YakSwap 
Dex aggregator for EVM chains. UI available [here](https://yieldyak.com/swap). 

## About

YakSwap is a set of smart contracts for optimal path finding between two assets and execution of that path. For input&output token and input-amount optimal path should have a greatest net amount-out by considering execution gas-cost.

Search is performed by calling on-chain query-methods and can be called by anyone. However, user should avoid calling query-methods in a mutative call due to a very large gas-cost associated with a call. 

## Usage

### Router

YakRouter is the user-facing interface to check prices and make trades.

| Chain | Address |
| --- | --- |
| Avalanche | [`0xC4729E56b831d74bBc18797e0e17A295fA77488c`](https://snowtrace.io/address/0xc4729e56b831d74bbc18797e0e17a295fa77488c) |
| Base | [`0x50564bF9cE3b1eA33c7bDb5acfFb1B997C319aE4`](https://basescan.org/address/0x50564bF9cE3b1eA33c7bDb5acfFb1B997C319aE4) |
| Arbitrum | [`0xb32C79a25291265eF240Eb32E9faBbc6DcEE3cE3`](https://arbiscan.io/address/0xb32C79a25291265eF240Eb32E9faBbc6DcEE3cE3) |
| Optimism | [`0xCd887F78c77b36B0b541E77AfD6F91C0253182A2`](https://optimistic.etherscan.io/address/0xCd887F78c77b36B0b541E77AfD6F91C0253182A2) |

Base also has a `SimpleRouter` deployment at [`0xD7A465165338B0B53dfDdef2Ee07cd8870Cd7dc7`](https://basescan.org/address/0xD7A465165338B0B53dfDdef2Ee07cd8870Cd7dc7).

#### **findBestPathWithGas**


Finds the best path from tokenA to tokenB. Considers path's amount-out and its gas-cost.

```solidity
function findBestPathWithGas(
    uint256 _amountIn,
    address _tokenIn,
    address _tokenOut,
    uint256 _maxSteps,
    uint256 _gasPrice
) external view returns (FormattedOffer memory);
```


| Input params | Details |
| ------------ | ------- |
| amountIn     |  Amount of tokens being sold       |
| tokenIn      |   ERC20 token being sold      |
| tokenOut     |    ERC20 token being bought     |
| steps        | Max number of steps for path finding (must be less than 4)    |
| gasPrice             |   Gas price in gwei that will be used to estimate gasCost of each step      |


```solidity
struct FormattedOffer {
    uint256[] amounts;
    address[] adapters;
    address[] path;
    uint256 gasEstimate;
}
```


| Return arg | Details                                                                                        |
| ---------- | ---------------------------------------------------------------------------------------------- |
| amounts    | Amount of token being swapped for each step. First amount is `_amountIn` and last `amountOut`. |
| adapters   | Addresses of adapters through which trade goes.                                                |
| path       | Addresses of tokens through which trade goes. First token is `_tokenIn` and last `_tokenOut`.  |
|   gasEstimate         |     Rough estimate for gas-cost of all swaps. Gas estimates only include gas-cost of swapping and querying on adapter and not intermediate logic, nor tx-gas-cost.                                                                                           |



#### **swapNoSplit**

Executes trades through provided path.

```solidity
function swapNoSplit(
    Trade calldata _trade,
    address _to,
    uint256 _fee
) external;
```


| Input param | Details |
| ----------- | ------- |
| _trade            |   Arguments used for swapping      |
|  _to           |  Reciever address       |
| _fee        |  Optional fee in bps taken before the trades    |


```solidity
struct Trade {
    uint256 amountIn;
    uint256 amountOut;
    address[] path;
    address[] adapters;
}
```


| Param | Details |
| -------- | -------- |
| amountIn     |  Amount of tokens being sold     |
| amountOut     |  Amount of tokens being bought     |
| path     |   Tokens being traded in respective order     |
| adapters     |   Adapters through which tokens will be traded in respective order    |






### Adapter

Adapters act as a common interface for YakRouter to interact with external contracts.

Adapters offers methods: `query` and `swap`. 

```solidity
function query(
    uint256 _amountIn,
    address _tokenIn,
    address _tokenOut
) external view returns (uint256);

function swap(
    uint256 _amountIn,
    uint256 _amountOut,
    address _fromToken,
    address _toToken,
    address _to
) external;
```

See [`deployments/`](./deployments) for known router, adapter, hop-token, and Uniswap V4 pool configuration by chain. To inspect a live router, use the Foundry script:

```bash
forge script script/admin/ListAdapters.s.sol --rpc-url <network>
```

Examples:

```bash
forge script script/admin/ListAdapters.s.sol --rpc-url base
forge script script/admin/ListAdapters.s.sol --rpc-url avalanche
```


## Local Development and testing

This repository uses [Foundry](https://book.getfoundry.sh/) for compilation, testing, scripts, and deployment. Solidity package dependencies are managed with Foundry's native Soldeer integration and the checked-in `soldeer.lock` file.

### Install Foundry

```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

Make sure the Foundry binaries are available on your `PATH`:

```bash
forge --version
cast --version
anvil --version
```

### Install Dependencies

Clone submodules and install Soldeer dependencies:

```bash
git submodule update --init --recursive
forge soldeer update
```

### Set Environmental Variables

Copy the sample env file and fill in any private keys, RPC URLs, or explorer API keys needed for your workflow:

```bash
cp .env.sample .env
```

At minimum, fork tests and scripts need RPC endpoints for the networks you target. Public RPC examples:

```bash
export BASE_RPC="https://mainnet.base.org"
export AVALANCHE_RPC="https://api.avax.network/ext/bc/C/rpc"
```

`foundry.toml` currently defines RPC aliases for:

- `base`
- `avalanche`
- `arbitrum`
- `optimism`
- `mantle`

### Build

```bash
forge build
```

### Test

Run all tests:

```bash
forge test
```

Run Base tests:

```bash
forge test --match-path 'test/base/*.sol' --rpc-url base
```

Run Avalanche tests:

```bash
forge test --match-path 'test/avalanche/*.sol' --rpc-url avalanche
```

Run a single test file:

```bash
forge test --match-path test/base/Aerodrome.t.sol --rpc-url base
```

### Deploy

Deployment scripts live in [`script/deploy/`](./script/deploy). Run without `--broadcast` first to simulate, then add `--broadcast` to submit transactions.

Example simulation:

```bash
forge script script/deploy/base/DeploySimpleRouter.s.sol:DeploySimpleRouter --rpc-url base
```

Example broadcast:

```bash
forge script script/deploy/base/DeploySimpleRouter.s.sol:DeploySimpleRouter \
  --account deployer \
  --rpc-url base \
  --broadcast \
  --verify \
  --etherscan-api-key "$ETHERSCAN_API_KEY"
```

### Admin scripts

Admin scripts live in [`script/admin/`](./script/admin). They are generally written to support a dry-run/check mode without `--broadcast` and an execute mode with `--broadcast`.

Examples:

```bash
forge script script/admin/ListAdapters.s.sol --rpc-url base
forge script script/admin/UpdateAdapters.s.sol --account deployer --rpc-url base
forge script script/admin/UpdateAdapters.s.sol --account deployer --rpc-url base --broadcast
```

### Adding adapters

See [`docs/adding-new-adapter.md`](./docs/adding-new-adapter.md) for adapter requirements and implementation notes. New adapters should usually include:

- the adapter contract under [`src/adapters/`](./src/adapters)
- interface additions under [`src/interface/`](./src/interface), if needed
- deployment constants in [`deployments/`](./deployments)
- a deployment script under [`script/deploy/<network>/`](./script/deploy)
- fork tests under [`test/<network>/`](./test)

## Misc

* Static-Quoters used in KyberElastic, UniswapV3 and Quickswap adapters are published [here](https://github.com/eden-network/uniswap-v3-static-quoter).

## Audits and Security

This project is not audited. Use at your own risk.
For any questions or bug reports reach out via Telegram group [YakDevs](https://t.me/yakdevs) or its admins.

---



Project is licensed under GPL-3, although some parts of it might be less restrictive.
Copyright© 2021 Yield Yak
