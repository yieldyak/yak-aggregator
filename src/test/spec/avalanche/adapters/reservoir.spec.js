const { setTestEnv, addresses } = require('../../../utils/test-env')
const { exampleDex } = addresses.exampleNetwork


describe('YakAdapter - Reservoir', () => {

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
