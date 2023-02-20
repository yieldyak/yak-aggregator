const { setTestEnv, addresses } = require('../../../utils/test-env')
const { camelot } = addresses.arbitrum


describe('YakAdapter - Camelot', () => {
    
    let testEnv
    let tkns
    let ate // adapter-test-env

    before(async () => {
        const networkName = 'arbitrum'
        const forkBlockNumber = 52762574
        testEnv = await setTestEnv(networkName, forkBlockNumber)
        tkns = testEnv.supportedTkns

        const contractName = 'CamelotAdapter'
        const adapterArgs = [ 'CamelotAdapter', camelot.factory, 238_412 ]
        ate = await testEnv.setAdapterEnv(contractName, adapterArgs)
    })

    beforeEach(async () => {
        testEnv.updateTrader()
    })

    describe('Swapping matches query', async () => {

        it('100 USDC -> WETH', async () => {
            await ate.checkSwapMatchesQuery('100', tkns.USDC, tkns.WETH)
        })
        it('10 BTC -> WETH', async () => {
            await ate.checkSwapMatchesQuery('10', tkns.WBTC, tkns.WETH)
        })
        it('100 USDC -> USDT', async () => {
            await ate.checkSwapMatchesQuery('100', tkns.USDC, tkns.USDT)
        })

    })

    it('Query returns zero if tokens not found', async () => {
        const supportedTkn = tkns.USDC
        ate.checkQueryReturnsZeroForUnsupportedTkns(supportedTkn)
    })

    it('Gas-estimate is between max-gas-used and 110% max-gas-used', async () => {
        const options = [
            [ '1', tkns.USDC, tkns.USDT ],
            [ '1', tkns.WETH, tkns.WBTC ],
            [ '1', tkns.USDC, tkns.WETH ],
        ]
        await ate.checkGasEstimateIsSensible(options)
    })

})