const { setTestEnv, addresses } = require('../../../utils/test-env')
const { ArableSF } = addresses.avalanche.other


describe('YakAdapter - ArableSF', () => {
    
    let testEnv
    let tkns
    let ate // adapter-test-env

    before(async () => {
        const networkName = 'avalanche'
        const forkBlockNumber = 18109145
        testEnv = await setTestEnv(networkName, forkBlockNumber)
        tkns = testEnv.supportedTkns

        const contractName = 'ArableSFAdapter'
        const adapterArgs = [ 'ArableAdapter', ArableSF, 235_000 ]
        ate = await testEnv.setAdapterEnv(contractName, adapterArgs)
    })

    beforeEach(async () => {
        testEnv.updateTrader()
    })

    describe('Swapping matches query', async () => {

        it('0.01 USDCe -> USDC', async () => {
            await ate.checkSwapMatchesQuery('0.01', tkns.USDCe, tkns.USDC)
        })
        it('1 USDC -> USDt', async () => {
            await ate.checkSwapMatchesQuery('1', tkns.USDC, tkns.USDt)
        })
        it('1 USDt -> USDTe', async () => {
            await ate.checkSwapMatchesQuery('1', tkns.USDt, tkns.USDTe)
        })
        it('0.01 USDTe -> FRAXc', async () => {
            await ate.checkSwapMatchesQuery('0.01', tkns.USDTe, tkns.FRAXc)
        })
        it('1 FRAXc -> YUSD', async () => {
            await ate.checkSwapMatchesQuery('1', tkns.FRAXc, tkns.YUSD)
        })
        it('1 YUSD -> arUSD', async () => {
            await ate.checkSwapMatchesQuery('1', tkns.YUSD, tkns.arUSD)
        })
        it('0.01 arUSD -> USDCe', async () => {
            await ate.checkSwapMatchesQuery('0.01', tkns.arUSD, tkns.USDCe)
        })

    })

    it('Query returns zero if tokens not found', async () => {
        const supportedTkn = tkns.FRAX
        ate.checkQueryReturnsZeroForUnsupportedTkns(supportedTkn)
    })

    it('Gas-estimate is between max-gas-used and 110% max-gas-used', async () => {
        const options = [
            [ '0.01', tkns.USDCe, tkns.YUSD ],
            [ '0.01', tkns.USDTe, tkns.USDt ],
            [ '0.01', tkns.YUSD, tkns.FRAXc ],
            [ '0.01', tkns.arUSD, tkns.USDt ],
            [ '0.01', tkns.FRAXc, tkns.USDCe ],
            [ '0.01', tkns.arUSD, tkns.USDTe ],
        ]
        await ate.checkGasEstimateIsSensible(options)
    })

})