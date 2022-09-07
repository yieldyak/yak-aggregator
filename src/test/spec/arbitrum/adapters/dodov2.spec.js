const { setTestEnv, addresses } = require('../../../utils/test-env')
const { dodo } = addresses.arbitrum


describe('YakAdapter - DodoV2', function() {
    
    let testEnv
    let tkns
    let ate // adapter-test-env

    before(async () => {
        const networkName = 'arbitrum'
        const forkBlockNumber = 16152472
        testEnv = await setTestEnv(networkName, forkBlockNumber)
        tkns = testEnv.supportedTkns

        const contractName = 'DodoV2Adapter'
        const adapterArgs = [
            'DodoV1Adapter', 
            Object.values(dodo.v2.pools), 
            290_000,
        ]
        ate = await testEnv.setAdapterEnv(contractName, adapterArgs)
    })

    beforeEach(async () => {
        testEnv.updateTrader()
    })

    describe('Swapping matches query', async () => {

        it('100 USDC -> DODO', async () => {
            await ate.checkSwapMatchesQuery('100', tkns.USDC, tkns.DODO)
        })
        it('10 DODO -> USDC', async () => {
            await ate.checkSwapMatchesQuery('10', tkns.DODO, tkns.USDC)
        })

    })

    it('Query returns zero if tokens not found', async () => {
        const supportedTkn = tkns.USDC
        ate.checkQueryReturnsZeroForUnsupportedTkns(supportedTkn)
    })

    it('Gas-estimate is between max-gas-used and 110% max-gas-used', async () => {
        const options = [
            [ '100', tkns.USDC, tkns.DODO ],
            [ '100', tkns.DODO, tkns.USDC ],
        ]
        await ate.checkGasEstimateIsSensible(options)
    })

})