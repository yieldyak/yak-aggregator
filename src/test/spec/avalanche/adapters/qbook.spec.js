const { setTestEnv, addresses } = require('../../../utils/test-env')
const { qbook } = addresses.avalanche

describe('YakAdapter - QBook', () => {
    
    let testEnv
    let tkns
    let ate // adapter-test-env

    before(async () => {
        const networkName = 'avalanche'
        const forkBlockNumber = 21105600
        testEnv = await setTestEnv(networkName, forkBlockNumber)
        tkns = testEnv.supportedTkns

        const contractName = 'QBookAdapter'
        const adapterArgs = [ 'QBookV1Adapter', 140_000, qbook.router ]
        ate = await testEnv.setAdapterEnv(contractName, adapterArgs)
    })

    beforeEach(async () => {
        testEnv.updateTrader()
    })

    describe('Swapping matches query', async () => {

        it('1 USDC -> USDCe', async () => {
            await ate.checkSwapMatchesQuery('1', tkns.USDC, tkns.USDCe)
        })

        it('1 USDCe -> USDC', async () => {
            await ate.checkSwapMatchesQuery('1', tkns.USDCe, tkns.USDC)
        })

    })

    it('Query returns zero if tokens not found', async () => {
        const supportedTkn = tkns.USDC
        ate.checkQueryReturnsZeroForUnsupportedTkns(supportedTkn)
    })

    it('Gas-estimate is between max-gas-used and 110% max-gas-used', async () => {
        const options = [
            [ '1', tkns.USDC, tkns.USDCe ],
            [ '1', tkns.USDCe, tkns.USDC ],
        ]
        await ate.checkGasEstimateIsSensible(options)
    })

})