const { setTestEnv, addresses } = require('../../../utils/test-env')
const { SolisnekFactory } = addresses.avalanche.other


describe('YakAdapter - Solisnek', function() {
    
    let testEnv
    let tkns
    let ate // adapter-test-env

    before(async () => {
        const networkName = 'avalanche'
        const forkBlockNumber = 28898755
        testEnv = await setTestEnv(networkName, forkBlockNumber)
        tkns = testEnv.supportedTkns

        const contractName = 'VelodromeAdapter'
        const adapterArgs = [ 'SolisnekAdapter', SolisnekFactory, 4e5 ]
        ate = await testEnv.setAdapterEnv(contractName, adapterArgs)
    })

    beforeEach(async () => {
        testEnv.updateTrader()
    })

    describe('Swapping matches query', async () => {

        it('100 USDCe -> USDC', async () => {
            await ate.checkSwapMatchesQuery('100', tkns.USDCe, tkns.USDC)
        })
        it('100 AVAX -> USDC', async () => {
            await ate.checkSwapMatchesQuery('100', tkns.WAVAX, tkns.USDC)
        })
    })

    it('Query returns zero if tokens not found', async () => {
        const supportedTkn = tkns.USDC
        ate.checkQueryReturnsZeroForUnsupportedTkns(supportedTkn)
    })

    it('Gas-estimate is between max-gas-used and 110% max-gas-used', async () => {
        const options = [
            [ '1', tkns.USDC, tkns.WAVAX ],
            [ '1', tkns.USDCe, tkns.USDC ],
        ]
        await ate.checkGasEstimateIsSensible(options)
    })

})