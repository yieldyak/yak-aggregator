const { setTestEnv } = require('../../../utils/test-env')

describe('YakAdapter - savax', () => {
    
    let testEnv
    let tkns
    let ate // adapter-test-env

    before(async () => {
        const networkName = 'avalanche'
        const forkBlockNumber = 19595355
        testEnv = await setTestEnv(networkName, forkBlockNumber)
        tkns = testEnv.supportedTkns

        const contractName = 'SAvaxAdapter'
        const adapterArgs = [ 170_000 ]
        ate = await testEnv.setAdapterEnv(contractName, adapterArgs)
    })

    beforeEach(async () => {
        testEnv.updateTrader()
    })

    describe('Swapping matches query', async () => {

        it('100 WAVAX -> SAVAX', async () => {
            await ate.checkSwapMatchesQuery('100', tkns.WAVAX, tkns.SAVAX)
        })

    })

    it('Query returns zero if tokens not found', async () => {
        const supportedTkn = tkns.WAVAX
        ate.checkQueryReturnsZeroForUnsupportedTkns(supportedTkn)
    })

    it('Gas-estimate is between max-gas-used and 110% max-gas-used', async () => {
        const options = [
            [ '1', tkns.WAVAX, tkns.SAVAX ],
        ]
        await ate.checkGasEstimateIsSensible(options)
    })

})