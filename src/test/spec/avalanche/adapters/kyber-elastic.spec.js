const { setTestEnv, addresses } = require('../../../utils/test-env')
const { kyberElastic } = addresses.avalanche


describe('YakAdapter - KyberElastic', function() {
    
    let testEnv
    let tkns
    let ate // adapter-test-env

    before(async () => {
        const networkName = 'avalanche'
        const forkBlockNumber = 19931756
        testEnv = await setTestEnv(networkName, forkBlockNumber)
        tkns = testEnv.supportedTkns

        const contractName = 'KyberElasticAdapter'
        const adapterArgs = [ 
            'KyberElasticAdapter', 
            200_000,
            kyberElastic.quoter, 
            Object.values(kyberElastic.pools), 
        ]
        ate = await testEnv.setAdapterEnv(contractName, adapterArgs)
    })

    beforeEach(async () => {
        testEnv.updateTrader()
    })

    describe('Swapping matches query', async () => {

        it('100 SAVAX -> WAVAX', async () => {
            await ate.checkSwapMatchesQuery('100', tkns.SAVAX, tkns.WAVAX)
        })
        it('100 WAVAX -> SAVAX', async () => {
            await ate.checkSwapMatchesQuery('100', tkns.WAVAX, tkns.SAVAX)
        })
        it('100 YUSD -> USDC', async () => {
            await ate.checkSwapMatchesQuery('100', tkns.YUSD, tkns.USDC)
        })
        it('1 SAVAX -> YUSD', async () => {
            await ate.checkSwapMatchesQuery('1', tkns.SAVAX, tkns.YUSD)
        })
        it('100 USDt -> USDC', async () => {
            await ate.checkSwapMatchesQuery('100', tkns.USDt, tkns.USDC)
        })
        it('100 USDC -> USDTe', async () => {
            await ate.checkSwapMatchesQuery('100', tkns.USDC, tkns.USDt)
        })

    })

    it('Query returns zero if tokens not found', async () => {
        const supportedTkn = tkns.USDC
        await ate.checkQueryReturnsZeroForUnsupportedTkns(supportedTkn)
    })

    it('Gas-estimate is between max-gas-used and 110% max-gas-used', async () => {
        const options = [
            [ '100', tkns.SAVAX, tkns.WAVAX ],
            [ '100', tkns.YUSD, tkns.SAVAX ],
            [ '100', tkns.USDC, tkns.USDt ],
            [ '100', tkns.USDt, tkns.DAIe ],
        ]
        await ate.checkGasEstimateIsSensible(options)
    })

})