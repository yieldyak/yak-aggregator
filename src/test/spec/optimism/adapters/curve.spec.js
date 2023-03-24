const { setTestEnv, addresses } = require('../../../utils/test-env')
const { curve } = addresses.optimism


describe('YakAdapter - Curve', () => {

    const MaxDustWei = ethers.utils.parseUnits('1', 'wei')
    
    let testEnv
    let tkns
    let ate // adapter-test-env

    before(async () => {
        const networkName = 'optimism'
        const forkBlockNumber = 74264449
        testEnv = await setTestEnv(networkName, forkBlockNumber)
        tkns = testEnv.supportedTkns
    })

    beforeEach(async () => {
        testEnv.updateTrader()
    })

    describe('wsteth', () => {

        before(async () => {
            const contractName = 'CurvePlain128NativeAdapter'
            const adapterArgs = [ 
                'CurveWstethAdapter', 
                250_000, 
                curve.plain128_native.wsteth_eth, 
                tkns.WETH.address
            ]
            ate = await testEnv.setAdapterEnv(contractName, adapterArgs)
        })

        describe('Swapping matches query', async () => {

            it('20 ETH -> wstETH', async () => {
                await ate.checkSwapMatchesQueryWithDust(
                    '20', 
                    tkns.WETH, 
                    tkns.wstETH,
                    MaxDustWei
                )
            })
            it('134 wstETH -> ETH', async () => {
                await ate.checkSwapMatchesQueryWithDust(
                    '134', 
                    tkns.wstETH, 
                    tkns.WETH,
                    MaxDustWei
                )
            })
    
        })
    
        it('Query returns zero if tokens not found', async () => {
            const supportedTkn = tkns.WETH
            ate.checkQueryReturnsZeroForUnsupportedTkns(supportedTkn)
        })
    
        it('Gas-estimate is between max-gas-used and 110% max-gas-used', async () => {
            const options = [
                [ '1', tkns.WETH, tkns.wstETH ],
                [ '1', tkns.wstETH, tkns.WETH ],
                [ '1000', tkns.WETH, tkns.wstETH ],
            ]
            await ate.checkGasEstimateIsSensible(options)
        })

    })

})