const { setTestEnv, addresses } = require('../../../utils/test-env')
const { uniV3 } = addresses.optimism


describe('YakAdapter - UniswapV3', function() {
    
    let testEnv
    let tkns
    let ate // adapter-test-env

    before(async () => {
        const networkName = 'optimism'
        const forkBlockNumber = 12932984
        testEnv = await setTestEnv(networkName, forkBlockNumber)
        tkns = testEnv.supportedTkns

        const contractName = 'UniswapV3Adapter'
        const adapterArgs = [ 'UniswapV3Adapter', uniV3.factory, uniV3.quoter, 8e5 ]
        ate = await testEnv.setAdapterEnv(contractName, adapterArgs)
    })

    beforeEach(async () => {
        testEnv.updateTrader()
    })

    describe('Swapping matches query', async () => {

        it('100 DAI -> USDC', async () => {
            await ate.checkSwapMatchesQuery('100', tkns.DAI, tkns.USDC)
        })
        it('100 DAI -> WETH', async () => {
            await ate.checkSwapMatchesQuery('100', tkns.DAI, tkns.WETH)
        })
        it('100 USDC -> USDT', async () => {
            await ate.checkSwapMatchesQuery('100', tkns.USDC, tkns.USDT)
        })
        it('100 USDC -> DAI', async () => {
            await ate.checkSwapMatchesQuery('100', tkns.USDC, tkns.DAI)
        })
        it('100 WETH -> WBTC', async () => {
            await ate.checkSwapMatchesQuery('100', tkns.WETH, tkns.WBTC)
        })
        it('100 USDT -> WETH', async () => {
            await ate.checkSwapMatchesQuery('100', tkns.USDT, tkns.WETH)
        })

    })

    it('Query returns zero if tokens not found', async () => {
        const supportedTkn = tkns.WBTC
        ate.checkQueryReturnsZeroForUnsupportedTkns(supportedTkn)
    })

    it('Gas-estimate is between max-gas-used and 110% max-gas-used', async () => {
        const options = [
            [ '100', tkns.DAI, tkns.USDT ],
            [ '100', tkns.USDC, tkns.DAI ],
            [ '100', tkns.USDT, tkns.USDC ],
        ]
        await ate.checkGasEstimateIsSensible(options)
    })

})