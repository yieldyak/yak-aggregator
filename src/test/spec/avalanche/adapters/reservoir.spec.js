const { expect } = require("chai")
const { setTestEnv, addresses } = require('../../../utils/test-env')
const { reservoir } = addresses.avalanche

describe('YakAdapter - Reservoir', () => {

    let testEnv
    let tkns
    let ate // adapter-test-env

    before(async () => {
        const networkName = 'avalanche'
        const forkBlockNumber = 36275195
        testEnv = await setTestEnv(networkName, forkBlockNumber)
        tkns = testEnv.supportedTkns

        const contractName = 'ReservoirAdapter'
        const gasEstimate = 350_000
        const adapterArgs = [
            contractName,
            reservoir.factory,
            reservoir.quoter,
            gasEstimate
        ]
        ate = await testEnv.setAdapterEnv(contractName, adapterArgs)
    })

    beforeEach(async () => {
        testEnv.updateTrader()
    })

    describe('Swapping matches query', async () => {
        it('100 USDt -> USDC', async () => {
            await ate.checkSwapMatchesQuery('100', tkns.USDt, tkns.USDC)
        })
        it('1 USDC -> BTC.b', async () => {
            await ate.checkSwapMatchesQuery('10', tkns.USDC, tkns.BTCb)
        })
    })

    it('Query returns zero if tokens not found', async () => {
        const supportedTkn = tkns.USDC
        await ate.checkQueryReturnsZeroForUnsupportedTkns(supportedTkn)
    })

    it ('Query returns something for a valid pair', async () => {
        // 1 USDC
        const amountOutQuery = await ate.query('1000000', tkns.USDC.address, tkns.USDt.address)
        expect(amountOutQuery).gt(0)
    })

    it('Gas-estimate is between max-gas-used and 110% max-gas-used', async () => {
        const options = [
            [ '100', tkns.USDt, tkns.USDC ],
            [ '1', tkns.USDC, tkns.BTCb ],
        ]
        await ate.checkGasEstimateIsSensible(options)
    })
})
