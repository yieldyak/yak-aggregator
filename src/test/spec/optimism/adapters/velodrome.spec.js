const { setTestEnv, addresses } = require('../../../utils/test-env')
const { velodrome } = addresses.optimism


describe('YakAdapter - Velodrome', function() {
    
    let testEnv
    let tkns
    let ate // adapter-test-env

    before(async () => {
        const networkName = 'optimism'
        const forkBlockNumber = 12932984
        testEnv = await setTestEnv(networkName, forkBlockNumber)
        tkns = testEnv.supportedTkns

        const contractName = 'VelodromeAdapter'
        const adapterArgs = [ 'VelodromeAdapter', velodrome.factory, 2.8e5 ]
        ate = await testEnv.setAdapterEnv(contractName, adapterArgs)
    })

    beforeEach(async () => {
        testEnv.updateTrader()
    })

    describe('Swapping matches query', async () => {

        it('100 DAI -> USDC', async () => {
            await ate.checkSwapMatchesQuery('100', tkns.DAI, tkns.USDC)
        })
        it('100 OP -> USDC', async () => {
            await ate.checkSwapMatchesQuery('100', tkns.OP, tkns.USDC)
        })
        it('100 WETH -> USDC', async () => {
            await ate.checkSwapMatchesQuery('1', tkns.WETH, tkns.USDC)
        })
        it('100 USDC -> DAI', async () => {
            await ate.checkSwapMatchesQuery('100', tkns.USDC, tkns.DAI)
        })

    })

    it('Query returns zero if tokens not found', async () => {
        const supportedTkn = tkns.USDC
        ate.checkQueryReturnsZeroForUnsupportedTkns(supportedTkn)
    })

    it('Gas-estimate is between max-gas-used and 110% max-gas-used', async () => {
        const options = [
            [ '1', tkns.USDC, tkns.WETH ],
            [ '1', tkns.OP, tkns.USDC ],
            [ '1', tkns.DAI, tkns.OP ],
        ]
        await ate.checkGasEstimateIsSensible(options)
    })

})