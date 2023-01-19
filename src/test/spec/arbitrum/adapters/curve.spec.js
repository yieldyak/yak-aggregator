const { ethers } = require("hardhat")
const { expect } = require("chai")
const { parseUnits } = ethers.utils

const { setTestEnv, addresses } = require('../../../utils/test-env')
const { curve } = addresses.arbitrum


describe('YakAdapter - Curve', function() {

    const MaxAdapterDust = parseUnits('1', 'wei')

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

    describe('TwoStable', async () => {

        before(async () => {
            const contractName = 'CurvePlain128Adapter'
            const adapterArgs = [ 'CurveTwostable', curve.twostable, 260_000 ]
            ate = await testEnv.setAdapterEnv(contractName, adapterArgs)
        })

        describe('Swapping matches query', async () => {

            it('100 USDT -> USDC', async () => {
                await ate.checkSwapMatchesQueryWithDust(
                    '100', 
                    tkns.USDT, 
                    tkns.USDC, 
                    MaxAdapterDust
                )
            })
            it('10000 USDT -> USDC', async () => {
                await ate.checkSwapMatchesQueryWithDust(
                    '10000', 
                    tkns.USDT, 
                    tkns.USDC, 
                    MaxAdapterDust
                )
            })
            it('100 USDC -> USDT', async () => {
                await ate.checkSwapMatchesQueryWithDust(
                    '100', 
                    tkns.USDC, 
                    tkns.USDT, 
                    MaxAdapterDust
                )
            })
    
        })

        it('Query returns zero if tokens not found', async () => {
            const supportedTkn = tkns.USDC
            await ate.checkQueryReturnsZeroForUnsupportedTkns(supportedTkn)
        })
    
        it('Gas-estimate is between max-gas-used and 110% max-gas-used', async () => {
            const options = [
                [ '1', tkns.USDC, tkns.USDT ],
                [ '1', tkns.USDT, tkns.USDC ], 
            ]
            await ate.checkGasEstimateIsSensible(options)
        })

    })

    describe('TriCrypto', async () => {

        before(async () => {
            const contractName = 'CurvePlain256Adapter'
            const adapterArgs = [ 'CurveTricrypto', curve.tricrypto, 660_000 ]
            ate = await testEnv.setAdapterEnv(contractName, adapterArgs)
        })

        describe('Swapping matches query', async () => {

            it('2000000 USDT -> WETH', async () => {
                await ate.checkSwapMatchesQueryWithDust(
                    '2000000', 
                    tkns.USDT, 
                    tkns.WETH, 
                    MaxAdapterDust
                )
            })
            it('1000 WETH -> WBTC', async () => {
                await ate.checkSwapMatchesQueryWithDust(
                    '1000', 
                    tkns.WETH, 
                    tkns.WBTC, 
                    MaxAdapterDust
                )
            })
            it('300 WBTC -> USDT', async () => {
                await ate.checkSwapMatchesQueryWithDust(
                    '300', 
                    tkns.WBTC, 
                    tkns.USDT, 
                    MaxAdapterDust
                )
            })
    
        })

        it('Query returns zero if tokens not found', async () => {
            const supportedTkn = tkns.WBTC
            await ate.checkQueryReturnsZeroForUnsupportedTkns(supportedTkn)
        })
    
        it('Gas-estimate is between max-gas-used and 110% max-gas-used', async () => {
            const options = [
                [ '1', tkns.USDT, tkns.WBTC ],
                [ '1', tkns.WETH, tkns.USDT ], 
                [ '1', tkns.WBTC, tkns.WETH ], 
            ]
            await ate.checkGasEstimateIsSensible(options)
        })

    })

    describe('meta', async () => {

        const MaxErrorBps = 3

        before(async () => {
            const contractName = 'CurveMetaV3Adapter'
            const adapterArgs = [ 
                'CurveMetaAdapter', 
                [ curve.meta_frax, curve.meta_mim ], 
                480_000 
            ]
            ate = await testEnv.setAdapterEnv(contractName, adapterArgs)
        })

        describe('Swapping matches query', async () => {

            it('20000 FRAX -> USDT', async () => {
                await ate.checkSwapMatchesQueryWithErr(
                    '20000', 
                    tkns.FRAX, 
                    tkns.USDT, 
                    MaxErrorBps
                )
            })
            it('1 USDC -> FRAX', async () => {
                await ate.checkSwapMatchesQueryWithErr(
                    '1', 
                    tkns.USDC, 
                    tkns.FRAX, 
                    MaxErrorBps
                )
            })
            it('2222 USDC -> MIM', async () => {
                await ate.checkSwapMatchesQueryWithErr(
                    '2222', 
                    tkns.USDC, 
                    tkns.MIM, 
                    MaxErrorBps
                )
            })

            it('333331 MIM -> USDT', async () => {
                await ate.checkSwapMatchesQueryWithErr(
                    '333331', 
                    tkns.MIM, 
                    tkns.USDT, 
                    MaxErrorBps
                )
            })
    
        })

        it('Query returns zero if trade is between two underlying tokens', async () => {
            expect(await ate.query(
                parseUnits('1', 6), 
                tkns.USDC.address, 
                tkns.USDT.address,
            )).to.eq(ethers.constants.Zero)
        })

        it('Query returns zero if tokens not found', async () => {
            const supportedTkn = tkns.USDT
            await ate.checkQueryReturnsZeroForUnsupportedTkns(supportedTkn)
        })
    
        it('Gas-estimate is between max-gas-used and 110% max-gas-used', async () => {
            const options = [
                [ '1', tkns.USDT, tkns.FRAX ],
                [ '1', tkns.USDT, tkns.MIM ], 
                [ '1', tkns.FRAX, tkns.USDC ], 
                [ '1', tkns.MIM, tkns.USDC ], 
            ]
            await ate.checkGasEstimateIsSensible(options)
        })

    })

})