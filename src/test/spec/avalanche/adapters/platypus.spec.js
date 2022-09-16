const { setTestEnv, addresses } = require('../../../utils/test-env')
const { platypus } = addresses.avalanche


describe('YakAdapter - Platypus', () => {
    
    let testEnv
    let tkns
    let ate // adapter-test-env

    before(async () => {
        const networkName = 'avalanche'
        const forkBlockNumber = 19928827
        testEnv = await setTestEnv(networkName, forkBlockNumber)
        tkns = testEnv.supportedTkns

        const contractName = 'PlatypusAdapter'
        const adapterArgs = [ 
            'PlatypusAdapter', 
            470_000,
            [
                platypus.main, 
                platypus.frax,
                platypus.mim,
                platypus.savax,
                platypus.btc,
                platypus.yusd,
                platypus.h20,
                platypus.money,
                platypus.tsd,
                platypus.yyavax,
            ]
        ]
        ate = await testEnv.setAdapterEnv(contractName, adapterArgs)
    })

    beforeEach(async () => {
        testEnv.updateTrader()
    })

    describe('Swapping matches query :: main', async () => {

        it('100 USDt -> USDCe', async () => {
            await ate.checkSwapMatchesQuery('100', tkns.USDt, tkns.USDCe)
        })
        it('100 DAIe -> USDC', async () => {
            await ate.checkSwapMatchesQuery('100', tkns.DAIe, tkns.USDC)
        })
        it('100 USDCe -> DAIe', async () => {
            await ate.checkSwapMatchesQuery('100', tkns.USDCe, tkns.DAIe)
        })
        it('100 USDC -> USDt', async () => {
            await ate.checkSwapMatchesQuery('100', tkns.USDC, tkns.USDt)
        })

    })

    describe('Swapping matches query :: btc', async () => {

        it('100 WBTCe -> BTCb', async () => {
            await ate.checkSwapMatchesQuery('100', tkns.WBTCe, tkns.BTCb)
        })
        it('100 BTCb -> WBTCe', async () => {
            await ate.checkSwapMatchesQuery('100', tkns.BTCb, tkns.WBTCe)
        })

    })

    describe('Swapping matches query :: yusd', async () => {

        it('100 YUSD -> USDC', async () => {
            await ate.checkSwapMatchesQuery('100', tkns.YUSD, tkns.USDC)
        })
        it('100 USDC -> YUSD', async () => {
            await ate.checkSwapMatchesQuery('100', tkns.USDC, tkns.YUSD)
        })

    })

    describe('Swapping matches query :: savax', async () => {

        it('100 SAVAX -> WAVAX', async () => {
            await ate.checkSwapMatchesQuery('100', tkns.SAVAX, tkns.WAVAX)
        })
        it('100 WAVAX -> SAVAX', async () => {
            await ate.checkSwapMatchesQuery('100', tkns.WAVAX, tkns.SAVAX)
        })

    })

    describe('Swapping matches query :: yyavax', async () => {

        it('100 WAVAX -> yyAVAX', async () => {
            await ate.checkSwapMatchesQuery('10', tkns.WAVAX, tkns.yyAVAX)
        })
        it('100 yyAVAX -> WAVAX', async () => {
            await ate.mintAndSwap(
                ethers.utils.parseUnits('20'),
                ethers.utils.parseUnits('10'),
                tkns.WAVAX,
                tkns.yyAVAX, 
                ate.Adapter.address
            )
            await ate.checkSwapMatchesQuery('10', tkns.yyAVAX, tkns.WAVAX)
        })

    })

    describe('Swapping matches query :: frax', async () => {

        it('100 FRAXc -> USDC', async () => {
            await ate.checkSwapMatchesQuery('100', tkns.FRAXc, tkns.USDC)
        })
        it('100 USDC -> FRAXc', async () => {
            await ate.checkSwapMatchesQuery('100', tkns.USDC, tkns.FRAXc)
        })

    })

    describe('Swapping matches query :: money', async () => {

        it('100 MONEY -> USDC', async () => {
            await ate.checkSwapMatchesQuery('100', tkns.MONEY, tkns.USDC)
        })
        it('100 USDC -> MONEY', async () => {
            await ate.checkSwapMatchesQuery('100', tkns.USDC, tkns.MONEY)
        })

    })

    describe('Swapping matches query :: h20', async () => {

        it('100 H20 -> USDC', async () => {
            await ate.checkSwapMatchesQuery('100', tkns.H20, tkns.USDC)
        })
        it('100 USDC -> H20', async () => {
            await ate.checkSwapMatchesQuery('100', tkns.USDC, tkns.H20)
        })

    })

    describe('Swapping matches query :: TSD', async () => {

        it('100 TSD -> USDC', async () => {
            await ate.checkSwapMatchesQuery('100', tkns.TSD, tkns.USDC)
        })
        it('100 USDC -> TSD', async () => {
            await ate.checkSwapMatchesQuery('100', tkns.USDC, tkns.TSD)
        })

    })

    it('Query returns zero if tokens not found', async () => {
        const supportedTkn = tkns.USDC
        ate.checkQueryReturnsZeroForUnsupportedTkns(supportedTkn)
    })

    it('Gas-estimate is between max-gas-used and 110% max-gas-used', async () => {
        const options = [
            [ '1', tkns.USDt, tkns.USDCe ],
            [ '1', tkns.DAIe, tkns.USDC ],
            [ '1', tkns.TSD, tkns.USDC ],
            [ '1', tkns.SAVAX, tkns.WAVAX ],
        ]
        await ate.checkGasEstimateIsSensible(options)
    })

})