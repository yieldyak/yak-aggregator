const { expect } = require("chai")
const { setTestEnv, addresses } = require('../../../utils/test-env')
const { factory, quoter } = addresses.arbitrum.reservoir

describe('YakAdapter - Reservoir', () => {

    let testEnv
    let tkns
    let ate // adapter-test-env

    before(async () => {
        const networkName = 'arbitrum'
        const forkBlockNumber = 307257257
        testEnv = await setTestEnv(networkName, forkBlockNumber)
        tkns = testEnv.supportedTkns

        const contractName = 'ReservoirAdapter'
        const gasEstimate = 350_000
        const adapterArgs = [
            contractName,
            factory,
            quoter,
            gasEstimate
        ]
        ate = await testEnv.setAdapterEnv(contractName, adapterArgs)
    })

    beforeEach(async () => {
        testEnv.updateTrader()
    })

    describe('Swapping matches query', async () => {
        it('100 USDT -> USDC', async () => {
            await ate.checkSwapMatchesQuery('100', tkns.USDT, tkns.USDC)
        })
    })

    it('Query returns zero if tokens not found', async () => {
        const supportedTkn = tkns.USDC
        await ate.checkQueryReturnsZeroForUnsupportedTkns(supportedTkn)
    })

    it ('Query returns something for a valid pair', async () => {
        // 1 USDC
        const amountOutQuery = await ate.query('1000000', tkns.USDC.address, tkns.USDT.address)
        expect(amountOutQuery).gt(0)
    })

    it('Gas-estimate is between max-gas-used and 110% max-gas-used', async () => {
        const options = [
            [ '100', tkns.USDT, tkns.USDC ],
        ]
        await ate.checkGasEstimateIsSensible(options)
    })
})
