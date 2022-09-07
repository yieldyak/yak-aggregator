const { setTestEnv, addresses } = require('../../../utils/test-env')
const { gmx } = addresses.arbitrum


describe('YakAdapter - Gmx', () => {
    
    let testEnv
    let tkns
    let ate // adapter-test-env

    before(async () => {
        const networkName = 'arbitrum'
        const forkBlockNumber = 16485220
        testEnv = await setTestEnv(networkName, forkBlockNumber)
        tkns = testEnv.supportedTkns

        const contractName = 'GmxAdapter'
        const adapterArgs = [ 'GmxAdapter', gmx.vault, 630_000 ]
        ate = await testEnv.setAdapterEnv(contractName, adapterArgs)
    })

    beforeEach(async () => {
        testEnv.updateTrader()
    })

    describe('Swapping matches query', async () => {

        it('100 USDC -> WETH', async () => {
            await ate.checkSwapMatchesQuery('100', tkns.USDC, tkns.WETH)
        })
        it('100 FRAX -> UNI', async () => {
            await ate.checkSwapMatchesQuery('100', tkns.FRAX, tkns.UNI)
        })
        it('100 DAI -> WBTC', async () => {
            await ate.checkSwapMatchesQuery('100', tkns.DAI, tkns.WBTC)
        })

    })

    it('Query returns zero if tokens not found', async () => {
        const supportedTkn = tkns.USDC
        ate.checkQueryReturnsZeroForUnsupportedTkns(supportedTkn)
    })

    it('Gas-estimate is between max-gas-used and 110% max-gas-used', async () => {
        const options = [
            [ '1', tkns.USDC, tkns.DAI ],
            [ '1', tkns.DAI, tkns.WETH ],
            [ '1', tkns.FRAX, tkns.UNI ],
        ]
        await ate.checkGasEstimateIsSensible(options)
    })

})