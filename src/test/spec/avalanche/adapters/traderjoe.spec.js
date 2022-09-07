const { setTestEnv, addresses } = require('../../../utils/test-env')
const { unilikeFactories } = addresses.avalanche

describe('YakAdapter - TraderJoe', () => {
    
    let testEnv
    let tkns
    let ate // adapter-test-env

    before(async () => {
        const networkName = 'avalanche'
        const forkBlockNumber = 19595355
        testEnv = await setTestEnv(networkName, forkBlockNumber)
        tkns = testEnv.supportedTkns

        const contractName = 'UniswapV2Adapter'
        const adapterArgs = [ 
            'UniswapV2Adapter', 
            unilikeFactories.joe, 
            3, 
            170_000
        ]
        ate = await testEnv.setAdapterEnv(contractName, adapterArgs)
    })

    beforeEach(async () => {
        testEnv.updateTrader()
    })

    describe('Swapping matches query', async () => {

        it('100 USDC -> WAVAX', async () => {
            await ate.checkSwapMatchesQuery('100', tkns.USDC, tkns.WAVAX)
        })

        it('100 WETHe -> WAVAX', async () => {
            await ate.checkSwapMatchesQuery('100', tkns.WETHe, tkns.WAVAX)
        })

        it('100 USDCe -> USDC', async () => {
            await ate.checkSwapMatchesQuery('100', tkns.USDCe, tkns.USDC)
        })

    })

    it('Query returns zero if tokens not found', async () => {
        const supportedTkn = tkns.WAVAX
        ate.checkQueryReturnsZeroForUnsupportedTkns(supportedTkn)
    })

    it('Gas-estimate is between max-gas-used and 110% max-gas-used', async () => {
        const options = [
            [ '1', tkns.USDC, tkns.WAVAX ],
            [ '1', tkns.WETHe, tkns.WAVAX ],
            [ '1', tkns.USDCe, tkns.USDC ],
        ]
        await ate.checkGasEstimateIsSensible(options)
    })

})