const { setTestEnv, addresses } = require('../../../utils/test-env')
const { balancerV2 } = addresses.arbitrum


describe('YakAdapter - BalancerV2', function() {
    
    let testEnv
    let tkns
    let ate // adapter-test-env

    before(async () => {
        const networkName = 'arbitrum'
        const forkBlockNumber = 16152472
        testEnv = await setTestEnv(networkName, forkBlockNumber)
        tkns = testEnv.supportedTkns

        const contractName = 'BalancerV2Adapter'
        const adapterArgs = [
            'BalancerV2', 
            balancerV2.vault, 
            Object.values(balancerV2.pools), 
            280_000,
        ]
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
        it('100 USDC -> STG', async () => {
            await ate.checkSwapMatchesQuery('100', tkns.USDC, tkns.STG)
        })

    })

    it('Query returns zero if tokens not found', async () => {
        const supportedTkn = tkns.USDC
        ate.checkQueryReturnsZeroForUnsupportedTkns(supportedTkn)
    })

    it('Gas-estimate is between max-gas-used and 110% max-gas-used', async () => {
        const options = [
            [ '100', tkns.USDC, tkns.STG ],
            [ '100', tkns.USDC, tkns.WBTC ],
            [ '100', tkns.USDC, tkns.WETH ],
        ]
        await ate.checkGasEstimateIsSensible(options)
    })

})