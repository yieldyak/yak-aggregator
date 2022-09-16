const { setTestEnv, addresses } = require('../../../utils/test-env')
const { quickswap } = addresses.dogechain


describe('YakAdapter - Quickswap', function() {
    
    let testEnv
    let tkns
    let ate // adapter-test-env

    before(async () => {
        const networkName = 'dogechain'
        const forkBlockNumber = 2109208
        testEnv = await setTestEnv(networkName, forkBlockNumber)
        tkns = testEnv.supportedTkns

        const contractName = 'AlgebraAdapter'
        const adapterArgs = [ 
            'QuickswapAdapter', 
            800_000, 
            quickswap.algebraQuoter, 
            quickswap.quickswapFactory, 
        ]
        ate = await testEnv.setAdapterEnv(contractName, adapterArgs)
    })

    beforeEach(async () => {
        testEnv.updateTrader()
    })

    describe('Swapping matches query', async () => {

        it('100 USDC -> WWDOGE', async () => {
            await ate.checkSwapMatchesQuery('100', tkns.USDC, tkns.WWDOGE)
        })
        it('100 WWDOGE -> USDC', async () => {
            await ate.checkSwapMatchesQuery('100', tkns.WWDOGE, tkns.USDC)
        })
        it('100 USDC -> ETH', async () => {
            await ate.checkSwapMatchesQuery('100', tkns.USDC, tkns.ETH)
        })
        it('1 ETH -> USDC', async () => {
            await ate.checkSwapMatchesQuery('1', tkns.ETH, tkns.USDC)
        })
        it('100 WWDOGE -> DC', async () => {
            await ate.checkSwapMatchesQuery('100', tkns.WWDOGE, tkns.DC)
        })
        it('100 DC -> WWDOGE', async () => {
            await ate.checkSwapMatchesQuery('100', tkns.DC, tkns.WWDOGE)
        })

    })

    it('Query returns zero if tokens not found', async () => {
        const supportedTkn = tkns.ETH
        await ate.checkQueryReturnsZeroForUnsupportedTkns(supportedTkn)
    })

    it('Gas-estimate is between max-gas-used and 110% max-gas-used', async () => {
        const options = [
            [ '100', tkns.USDC, tkns.ETH ],
            [ '100', tkns.WWDOGE, tkns.USDC ],
            [ '100', tkns.DC, tkns.WWDOGE ],
        ]
        await ate.checkGasEstimateIsSensible(options)
    })

})