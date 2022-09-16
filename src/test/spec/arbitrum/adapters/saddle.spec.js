const { setTestEnv, addresses } = require('../../../utils/test-env')
const { saddle } = addresses.arbitrum


describe('YakAdapter - Saddle', () => {
    
    let testEnv
    let tkns
    let ate // adapter-test-env

    before(async () => {
        const networkName = 'arbitrum'
        const forkBlockNumber = 16485220
        testEnv = await setTestEnv(networkName, forkBlockNumber)
        tkns = testEnv.supportedTkns
    })

    beforeEach(async () => {
        testEnv.updateTrader()
    })

    describe('arbusd', () => {

        before(async () => {
            const contractName = 'SaddleAdapter'
            const adapterArgs = [ 'SaddleArbusd', saddle.arbusd, 360_000 ]
            ate = await testEnv.setAdapterEnv(contractName, adapterArgs)
        })

        describe('Swapping matches query', async () => {

    
            it('1000000 MIM -> USDC', async () => {
                await ate.checkSwapMatchesQuery('1000000', tkns.MIM, tkns.USDC)
            })
            it('1000000 USDT -> USDC', async () => {
                await ate.checkSwapMatchesQuery('1000000', tkns.USDT, tkns.USDC)
            })
            it('3333 USDT -> MIM', async () => {
                await ate.checkSwapMatchesQuery('3333', tkns.USDT, tkns.MIM)
            })
            it('3 USDC -> USDT', async () => {
                await ate.checkSwapMatchesQuery('3', tkns.USDC, tkns.USDT)
            })
    
        })
    
        it('Query returns zero if tokens not found', async () => {
            const supportedTkn = tkns.USDC
            ate.checkQueryReturnsZeroForUnsupportedTkns(supportedTkn)
        })
    
        it('Gas-estimate is between max-gas-used and 110% max-gas-used', async () => {
            const options = [
                [ '1', tkns.USDC, tkns.USDT ],
                [ '1', tkns.USDT, tkns.MIM ],
                [ '1', tkns.MIM, tkns.USDC ],
                [ '1', tkns.MIM, tkns.USDT ],
            ]
            await ate.checkGasEstimateIsSensible(options)
        })

    })

    describe('arbusdV2', () => {

        before(async () => {
            const contractName = 'SaddleAdapter'
            const adapterArgs = [ 'SaddleArbusdV2', saddle.arbusdV2, 340_000 ]
            ate = await testEnv.setAdapterEnv(contractName, adapterArgs)
        })

        describe('Swapping matches query', async () => {

    
            it('50000 FRAX -> USDC', async () => {
                await ate.checkSwapMatchesQuery('50000', tkns.FRAX, tkns.USDC)
            })
            it('50000 USDT -> USDC', async () => {
                await ate.checkSwapMatchesQuery('50000', tkns.USDT, tkns.USDC)
            })
            it('3333 USDT -> FRAX', async () => {
                await ate.checkSwapMatchesQuery('3333', tkns.USDT, tkns.FRAX)
            })
            it('3 USDC -> USDT', async () => {
                await ate.checkSwapMatchesQuery('3', tkns.USDC, tkns.USDT)
            })
    
        })
    
        it('Query returns zero if tokens not found', async () => {
            const supportedTkn = tkns.USDC
            ate.checkQueryReturnsZeroForUnsupportedTkns(supportedTkn)
        })
    
        it('Gas-estimate is between max-gas-used and 110% max-gas-used', async () => {
            const options = [
                [ '1', tkns.USDC, tkns.USDT ],
                [ '1', tkns.USDT, tkns.FRAX ],
                [ '1', tkns.FRAX, tkns.USDC ],
                [ '1', tkns.FRAX, tkns.USDT ],
            ]
            await ate.checkGasEstimateIsSensible(options)
        })

    })

    describe('meta_arbusdV2', () => {

        const maxErrorBps = 3

        before(async () => {
            const contractName = 'SaddleMetaAdapter'
            const adapterArgs = [ 'SaddleMetaArbV2', saddle.meta_arbusdV2, 350_000 ]
            ate = await testEnv.setAdapterEnv(contractName, adapterArgs)
        })

        describe('Swapping matches query with error', async () => {

            it('30 USDs -> USDC', async () => {
                await ate.checkSwapMatchesQueryWithErr(
                    '30', 
                    tkns.USDs,
                    tkns.USDC,
                    maxErrorBps
                )
            })
            it('1000000 USDs -> USDT', async () => {
                await ate.checkSwapMatchesQueryWithErr(
                    '100000', 
                    tkns.USDs,
                    tkns.USDT,
                    maxErrorBps
                )
            })
            it('1 USDs -> FRAX', async () => {
                await ate.checkSwapMatchesQueryWithErr(
                    '1', 
                    tkns.USDs,
                    tkns.FRAX,
                    maxErrorBps
                )  
            })
            it('2133 USDC -> USDs', async () => {
                await ate.checkSwapMatchesQueryWithErr(
                    '2133', 
                    tkns.USDC,
                    tkns.USDs,
                    maxErrorBps
                ) 
            })
            it('2133 USDT -> USDs', async () => {
                await ate.checkSwapMatchesQueryWithErr(
                    '2133', 
                    tkns.USDT,
                    tkns.USDs,
                    maxErrorBps
                ) 
            })
            it('2133 FRAX -> USDs', async () => {
                await ate.checkSwapMatchesQueryWithErr(
                    '2133', 
                    tkns.FRAX,
                    tkns.USDs,
                    maxErrorBps
                ) 
            })
    
        })
    
        it('Query returns zero if tokens not found', async () => {
            const supportedTkn = tkns.USDC
            ate.checkQueryReturnsZeroForUnsupportedTkns(supportedTkn)
        })
    
        it('Gas-estimate is between max-gas-used and 110% max-gas-used', async () => {
            const options = [
                [ '1', tkns.USDC, tkns.USDT ],
                [ '1', tkns.USDT, tkns.FRAX ],
                [ '1', tkns.FRAX, tkns.USDC ],
                [ '1', tkns.FRAX, tkns.USDT ],
            ]
            await ate.checkGasEstimateIsSensible(options)
        })

    })


})