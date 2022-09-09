# Adding new adapter

## About

#### Purpose of adapter

Adapter server as a common interface for external contracts to perform queries and swaps. 

YakRouter uses adapter to find the best offer between two tokens for a given amount and execute this offer. It also accounts for query&swap gas-cost of the offer and for that needs gasEstimate from the adapter.

#### Adapter must expose:
 * `query(uint256 amountIn, address tokenIn, address tokenOut) returns (uint256 minAmountOut)`
Returns amount user recieves after swap. Exact amount or less. Latter case can happen due to imprecision of certain external queries. Query should never return more than what is swapped.
 * `swap(uint256 amountIn, uint256 minAmountOut, address tokenIn , address tokenOut, address to)`
Executes swap and transfers `tokenOut` to `to` address
 * `gasEstimate() returns (uint256)`
Returns rough gas estimate for querying and swapping through the adapter

#### Adapter limits

###### Multiple pools in adapter

For YakRouter adapter also acts as indentifier(address) where given offer can be swapped. If multiple pools are referenced through single adapter they should be distinguishable by tokenIn-tokenOut combination.

For example: UniswapV2 offers factory method through which token combination is mapped to the corresponding pool. Mapping is injective (only one pool for token combination). Swap method can unambiguously reference tokenIn&tokenTo to a pool to swap through. Contrary, KyberDex factory maps token combination to a list of pools. Here swap method can't know through which pool user wants to swap through.

The limitation can be overcome by having one adapter for each pool or by finding best pool to swap through in the swap method itself. 

## Contract

Use boilerplate below as a starting point for developing an adapter.

```solidity
//       ╟╗                                                                      ╔╬
//       ╞╬╬                                                                    ╬╠╬
//      ╔╣╬╬╬                                                                  ╠╠╠╠╦
//     ╬╬╬╬╬╩                                                                  ╘╠╠╠╠╬
//    ║╬╬╬╬╬                                                                    ╘╠╠╠╠╬
//    ╣╬╬╬╬╬╬╬╬╬╬╬╬╬╬╬      ╒╬╬╬╬╬╬╬╜   ╠╠╬╬╬╬╬╬╬         ╠╬╬╬╬╬╬╬    ╬╬╬╬╬╬╬╬╠╠╠╠╠╠╠╠
//    ╙╬╬╬╬╬╬╬╬╬╬╬╬╬╬╬╬╕    ╬╬╬╬╬╬╬╜   ╣╠╠╬╬╬╬╬╬╬╬        ╠╬╬╬╬╬╬╬   ╬╬╬╬╬╬╬╬╬╠╠╠╠╠╠╠╩
//     ╙╣╬╬╬╬╬╬╬╬╬╬╬╬╬╬╬  ╔╬╬╬╬╬╬╬    ╔╠╠╠╬╬╬╬╬╬╬╬        ╠╬╬╬╬╬╬╬ ╣╬╬╬╬╬╬╬╬╬╬╬╠╠╠╠╝╙
//               ╘╣╬╬╬╬╬╬╬╬╬╬╬╬╬╬    ╒╠╠╠╬╠╬╩╬╬╬╬╬╬       ╠╬╬╬╬╬╬╬╣╬╬╬╬╬╬╬╙
//                 ╣╬╬╬╬╬╬╬╬╬╬╠╣     ╣╬╠╠╠╬╩ ╚╬╬╬╬╬╬      ╠╬╬╬╬╬╬╬╬╬╬╬╬╬╬
//                  ╣╬╬╬╬╬╬╬╬╬╣     ╣╬╠╠╠╬╬   ╣╬╬╬╬╬╬     ╠╬╬╬╬╬╬╬╬╬╬╬╬╬╬
//                   ╟╬╬╬╬╬╬╬╩      ╬╬╠╠╠╠╬╬╬╬╬╬╬╬╬╬╬     ╠╬╬╬╬╬╬╬╠╬╬╬╬╬╬╬
//                    ╬╬╬╬╬╬╬     ╒╬╬╠╠╬╠╠╬╬╬╬╬╬╬╬╬╬╬╬    ╠╬╬╬╬╬╬╬ ╣╬╬╬╬╬╬╬
//                    ╬╬╬╬╬╬╬     ╬╬╬╠╠╠╠╝╝╝╝╝╝╝╠╬╬╬╬╬╬   ╠╬╬╬╬╬╬╬  ╚╬╬╬╬╬╬╬╬
//                    ╬╬╬╬╬╬╬    ╣╬╬╬╬╠╠╩       ╘╬╬╬╬╬╬╬  ╠╬╬╬╬╬╬╬   ╙╬╬╬╬╬╬╬╬
//
//

// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.0;

import "../lib/SafeERC20.sol";
import "../YakAdapter.sol";


contract ExampleAdapter is YakAdapter {
    using SafeERC20 for IERC20;

    constructor(
        string memory name, 
        uint256 _swapGasEstimate,
        ...
    ) YakAdapter(name, _swapGasEstimate) {
        // init vars, set allowances ...
    }

    function _query(
        uint256 _amountIn,
        address _tokenIn,
        address _tokenOut
    ) internal view override returns (uint256 amountOut) {
        if (_validPath(_amountIn, _tokenIn, _tokenOut))
            return 0;
        // perform query ...
    }
    
    function _validPath() internal view returns (bool) {
        // check if token combination and amountIn is valid for the pool
    }

    function _swap(
        uint256 _amountIn,
        uint256 _amountOut,
        address _tokenIn,
        address _tokenOut,
        address _to
    ) internal override {
        // execute swap ... 
        // if external contract doesn't check minAmountOut is matched
        // then check bal of this contract is gte _amountOut
        _returnTo(_tokenOut, shares, _to);
    }

}
```


## Test

Use boilerplate below as a starting point for testing the adapter implementation for specific dex.

```javascript
const { setTestEnv, addresses } = require('../../../utils/test-env')
const { exampleDex } = addresses.exampleNetwork


describe('YakAdapter - Example', () => {
    
    let testEnv
    let tkns
    let ate // adapter-test-env

    before(async () => {
        const networkName = 'exampleNetwork'
        const forkBlockNumber = 1111111
        testEnv = await setTestEnv(networkName, forkBlockNumber)
        tkns = testEnv.supportedTkns

        const contractName = 'ExampleAdapter'
        const gasEstimate = 222_222
        const adapterArgs = [
            'ExampleAdapter',
            gasEstimate,
            exampleDex,
            ...
        ]
        ate = await testEnv.setAdapterEnv(contractName, adapterArgs)
    })

    beforeEach(async () => {
        testEnv.updateTrader()
    })

    describe('Swapping matches query', async () => {

        it('100 TKN_A -> TKN_B', async () => {
            await ate.checkSwapMatchesQuery('100', tkns.TKN_A, tkns.TKN_B)
        })
        it('10 TKN_B -> TKN_C', async () => {
            await ate.checkSwapMatchesQuery('10', tkns.TKN_B, tkns.TKN_C)
        })
        it('100 TKN_C -> TKN_A', async () => {
            await ate.checkSwapMatchesQuery('100', tkns.TKN_C, tkns.TKN_A)
        })

    })

    it('Query returns zero if tokens not found', async () => {
        const supportedTkn = tkns.TKN_A
        ate.checkQueryReturnsZeroForUnsupportedTkns(supportedTkn)
    })

    it('Gas-estimate is between max-gas-used and 110% max-gas-used', async () => {
        const options = [
            [ '100', tkns.TKN_A, tkns.TKN_C ],
            [ '100', tkns.TKN_C, tkns.TKN_B ],
            [ '100', tkns.TKN_B, tkns.TKN_A ],
        ]
        await ate.checkGasEstimateIsSensible(options)
    })

})

```

If your implementation references any external contracts (eg. pool, tokens) add them to `src/misc/addresses.json`. For constants add to `src/misc/constants.json`.

## Deploy-script

> Deployment scripts are stored in `src/deploy`

Use boilerplate below to make deploy script.

```javascript
const { deployAdapter, addresses } = require('../../../utils')
const { exampleDex } = addresses.exampleNetwork

const networkName = 'exampleNetwork'
const tags = [ 'exampleDex' ]
const name = 'ExampleAdapterV1'
const contractName = 'ExampleAdapter'

const gasEstimate = 222_222
const args = [ name, gasEstimate, ... ]

module.exports = deployAdapter(networkName, tags, name, contractName, args)
```