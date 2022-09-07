const { setTestEnv, addresses } = require('../../../utils/test-env')
const { GmxVault } = addresses.avalanche.other


describe('YakAdapter - Gmx', () => {
    
    let testEnv
    let tkns
    let ate // adapter-test-env

    before(async () => {
        const networkName = 'avalanche'
        const forkBlockNumber = 19595355
        testEnv = await setTestEnv(networkName, forkBlockNumber)
        tkns = testEnv.supportedTkns

        const contractName = 'GmxAdapter'
        const adapterArgs = [ 'GmxAdapter', GmxVault, 630_000 ]
        ate = await testEnv.setAdapterEnv(contractName, adapterArgs)
    })

    beforeEach(async () => {
        testEnv.updateTrader()
    })

    describe('Swapping matches query', async () => {

        it('100 USDCe -> WAVAX', async () => {
            await ate.checkSwapMatchesQuery('100', tkns.USDCe, tkns.WAVAX)
        })
        it('100 WAVAX -> USDC', async () => {
            await ate.checkSwapMatchesQuery('100', tkns.WAVAX, tkns.USDC)
        })
        it('1 WBTCe -> USDCe', async () => {
            await ate.checkSwapMatchesQuery('1', tkns.WBTCe, tkns.USDCe)
        })
        it('100 WETHe -> WBTCe', async () => {
            await ate.checkSwapMatchesQuery('100', tkns.WETHe, tkns.WBTCe)
        })
        it('100 USDC -> WETHe', async () => {
            await ate.checkSwapMatchesQuery('100', tkns.USDC, tkns.WETHe)
        })

    })

    it('Query returns zero if tokens not found', async () => {
        const supportedTkn = tkns.WAVAX
        ate.checkQueryReturnsZeroForUnsupportedTkns(supportedTkn)
    })

    it('Gas-estimate is between max-gas-used and 110% max-gas-used', async () => {
        const options = [
            [ '1', tkns.USDC, tkns.USDCe ],
            [ '1', tkns.WBTCe, tkns.USDC ],
            [ '1', tkns.WAVAX, tkns.WETHe ],
        ]
        await ate.checkGasEstimateIsSensible(options)
    })

})