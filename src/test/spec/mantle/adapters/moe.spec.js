const { setTestEnv, addresses } = require('../../../utils/test-env')
const { unilikeFactories } = addresses.mantle

describe('YakAdapter - Moe', () => {
    
    let testEnv
    let tkns
    let ate // adapter-test-env

    before(async () => {
        const networkName = 'mantle'
        const forkBlockNumber = 41733921
        testEnv = await setTestEnv(networkName, forkBlockNumber)
        tkns = testEnv.supportedTkns

        const contractName = 'UniswapV2Adapter'
        const adapterArgs = [ 
            'UniswapV2Adapter', 
            unilikeFactories.moe, 
            3, 
            170_000
        ]
        ate = await testEnv.setAdapterEnv(contractName, adapterArgs)
    })

    beforeEach(async () => {
        testEnv.updateTrader()
    })

    describe('Swapping matches query', async () => {

        it('100 USDC -> WETH', async () => {
            await ate.checkSwapMatchesQuery('100', tkns.USDC, tkns.WETH)
        })
                                
        it('100 WMNT -> WETH', async () => {
            await ate.checkSwapMatchesQuery('100', tkns.WMNT, tkns.WETH)
        })

        it('100 USDT -> USDC', async () => {
            await ate.checkSwapMatchesQuery('100', tkns.USDT, tkns.USDC)
        })

    })

    it('Query returns zero if tokens not found', async () => {
        const supportedTkn = tkns.WETH
        ate.checkQueryReturnsZeroForUnsupportedTkns(supportedTkn)
    })

    it('Gas-estimate is between max-gas-used and 110% max-gas-used', async () => {
        const options = [
            [ '1', tkns.USDC, tkns.WETH ],
            [ '1', tkns.WMNT, tkns.WETH ],
            [ '1', tkns.USDT, tkns.USDC ],
        ]
        await ate.checkGasEstimateIsSensible(options)
    })

})