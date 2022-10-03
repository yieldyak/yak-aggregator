const { expect } = require('chai')
const { setTestEnv, addresses } = require('../../../utils/test-env')
const { curvelikePools } = addresses.avalanche


describe('YakAdapter - Curve', () => {

    const MaxDustWei = ethers.utils.parseUnits('1', 'wei')
    
    let testEnv
    let tkns
    let ate // adapter-test-env

    before(async () => {
        const networkName = 'avalanche'
        const forkBlockNumber = 19595355
        testEnv = await setTestEnv(networkName, forkBlockNumber)
        tkns = testEnv.supportedTkns
    })

    beforeEach(async () => {
        testEnv.updateTrader()
    })

    describe('aave', () => {

        const MaxErrBps = 1

        before(async () => {
            const contractName = 'Curve2Adapter'
            const adapterArgs = [ 
                'CurveAaveAdapter', 
                curvelikePools.CurveAave, 
                770_000
            ]
            ate = await testEnv.setAdapterEnv(contractName, adapterArgs)
        })

        describe('Swapping matches query :: 1 bps error', async () => {

            it('10000 USDCe -> DAIe', async () => {
                await ate.checkSwapMatchesQueryWithErr(
                    '10000', 
                    tkns.USDCe, 
                    tkns.DAIe,
                    MaxErrBps
                )
            })
            it('22222 USDTe -> DAIe', async () => {
                await ate.checkSwapMatchesQueryWithErr(
                    '22222', 
                    tkns.USDTe, 
                    tkns.DAIe,
                    MaxErrBps
                )
            })
            it('22222 USDCe -> USDTe', async () => {
                await ate.checkSwapMatchesQueryWithDustWithErr(
                    '22222', 
                    tkns.USDCe, 
                    tkns.USDTe,
                    MaxDustWei,
                    MaxErrBps
                )
            })
            it('22222 USDTe -> USDCe', async () => {
                await ate.checkSwapMatchesQueryWithDustWithErr(
                    '22222', 
                    tkns.USDTe, 
                    tkns.USDCe,
                    MaxDustWei,
                    MaxErrBps
                )
            })
            it('3333 DAIe -> USDTe', async () => {
                await ate.checkSwapMatchesQueryWithDustWithErr(
                    '3333', 
                    tkns.DAIe, 
                    tkns.USDTe,
                    MaxDustWei,
                    MaxErrBps
                )
            })
    
        })
    
        it('Query returns zero if tokens not found', async () => {
            const supportedTkn = tkns.MIM
            ate.checkQueryReturnsZeroForUnsupportedTkns(supportedTkn)
        })
    
        it('Gas-estimate is between max-gas-used and 110% max-gas-used', async () => {
            const options = [
                [ '1', tkns.USDCe, tkns.DAIe ],
                [ '1', tkns.DAIe, tkns.USDTe ],
                [ '1', tkns.USDTe, tkns.USDCe ],
            ]
            await ate.checkGasEstimateIsSensible(options)
        })

    })

    describe('atricrypto', () => {

        const MaxErrBps = 5

        before(async () => {
            const contractName = 'Curve1Adapter'
            const adapterArgs = [ 
                'CurveAtricrypto', 
                curvelikePools.CurveAtricrypto, 
                1_500_000
            ]
            ate = await testEnv.setAdapterEnv(contractName, adapterArgs)
        })

        describe('Swapping matches query :: 5 bps err', async () => {

            it('100 WBTCe -> DAIe', async () => {
                await ate.checkSwapMatchesQueryWithErr(
                    '1', 
                    tkns.WBTCe, 
                    tkns.DAIe,
                    MaxErrBps
                )
            })
            it('32 WETHe -> USDCe', async () => {
                await ate.checkSwapMatchesQueryWithErr(
                    '32', 
                    tkns.WETHe, 
                    tkns.USDCe,
                    MaxErrBps
                )
            })
            it('22222 USDCe -> WBTCe', async () => {
                await ate.checkSwapMatchesQueryWithErr(
                    '22222', 
                    tkns.USDCe, 
                    tkns.WBTCe,
                    MaxErrBps
                )
            })
            it('22222 DAIe -> USDTe', async () => {
                await ate.checkSwapMatchesQueryWithErr(
                    '22222', 
                    tkns.DAIe, 
                    tkns.USDTe,
                    MaxErrBps
                )
            })
            it('3333 USDTe -> WETHe', async () => {
                await ate.checkSwapMatchesQueryWithErr(
                    '3333', 
                    tkns.USDTe, 
                    tkns.WETHe,
                    MaxErrBps
                )
            })
    
        })
    
        it('Query returns zero if tokens not found', async () => {
            const supportedTkn = tkns.WETHe
            ate.checkQueryReturnsZeroForUnsupportedTkns(supportedTkn)
        })
    
        it('Gas-estimate is between max-gas-used and 110% max-gas-used', async () => {
            const options = [
                [ '1', tkns.USDCe, tkns.DAIe ],
                [ '1', tkns.DAIe, tkns.WETHe ],
                [ '1', tkns.USDTe, tkns.WBTCe ],
                [ '1', tkns.WETHe, tkns.USDTe ],
                [ '1', tkns.WBTCe, tkns.USDCe ],
            ]
            await ate.checkGasEstimateIsSensible(options)
        })

    })

    describe('ren', () => {

        const MaxErrBps = 1

        before(async () => {
            const contractName = 'Curve2Adapter'
            const adapterArgs = [ 
                'CurveRenAdapter', 
                curvelikePools.CurveRen, 
                500_000
            ]
            ate = await testEnv.setAdapterEnv(contractName, adapterArgs)
        })

        describe('Swapping matches query :: 1 bps err', async () => {

            it('20 WBTCe -> renBTC', async () => {
                await ate.checkSwapMatchesQueryWithErr(
                    '20', 
                    tkns.WBTCe, 
                    tkns.renBTC,
                    MaxErrBps
                )
            })
            it('2 renBTC -> WBTCe', async () => {
                await ate.checkSwapMatchesQueryWithErr(
                    '2', 
                    tkns.renBTC, 
                    tkns.WBTCe,
                    MaxErrBps
                )
            })
    
        })
    
        it('Query returns zero if tokens not found', async () => {
            const supportedTkn = tkns.WBTCe
            ate.checkQueryReturnsZeroForUnsupportedTkns(supportedTkn)
        })
    
        it('Gas-estimate is between max-gas-used and 110% max-gas-used', async () => {
            const options = [
                [ '1', tkns.WBTCe, tkns.renBTC ],
                [ '1', tkns.renBTC, tkns.WBTCe ],
            ]
            await ate.checkGasEstimateIsSensible(options)
        })

    })

    describe('3poolV2', () => {

        before(async () => {
            const contractName = 'CurvePlain128Adapter'
            const adapterArgs = [ 
                'Curve3poolV2Adapter', 
                curvelikePools.Curve3poolV2, 
                250_000
            ]
            ate = await testEnv.setAdapterEnv(contractName, adapterArgs)
        })

        describe('Swapping matches query', async () => {

            it('20 MIM -> USDCe', async () => {
                await ate.checkSwapMatchesQueryWithDust(
                    '20', 
                    tkns.MIM, 
                    tkns.USDCe,
                    MaxDustWei
                )
            })
            it('2333 USDCe -> USDTe', async () => {
                await ate.checkSwapMatchesQueryWithDust(
                    '2333', 
                    tkns.USDCe, 
                    tkns.USDTe,
                    MaxDustWei
                )
            })
            it('233 USDTe -> MIM', async () => {
                await ate.checkSwapMatchesQueryWithDust(
                    '233', 
                    tkns.USDTe, 
                    tkns.MIM,
                    MaxDustWei
                )
            })
    
        })
    
        it('Query returns zero if tokens not found', async () => {
            const supportedTkn = tkns.MIM
            ate.checkQueryReturnsZeroForUnsupportedTkns(supportedTkn)
        })
    
        it('Gas-estimate is between max-gas-used and 110% max-gas-used', async () => {
            const options = [
                [ '1', tkns.MIM, tkns.USDTe ],
                [ '1', tkns.USDCe, tkns.MIM ],
                [ '1', tkns.USDTe, tkns.USDCe ],
            ]
            await ate.checkGasEstimateIsSensible(options)
        })

    })

    describe('yusd', () => {

        before(async () => {
            const contractName = 'CurvePlain128Adapter'
            const adapterArgs = [ 
                'CurveYUSDAdapter', 
                curvelikePools.CurveYUSD, 
                280_000
            ]
            ate = await testEnv.setAdapterEnv(contractName, adapterArgs)
        })

        describe('Swapping matches query', async () => {

            it('20 YUSD -> USDC', async () => {
                await ate.checkSwapMatchesQueryWithDust(
                    '20', 
                    tkns.YUSD, 
                    tkns.USDC,
                    MaxDustWei
                )
            })
            it('2333 USDC -> USDt', async () => {
                await ate.checkSwapMatchesQueryWithDust(
                    '2333', 
                    tkns.USDC, 
                    tkns.USDt,
                    MaxDustWei
                )
            })
            it('233 USDt -> YUSD', async () => {
                await ate.checkSwapMatchesQueryWithDust(
                    '233', 
                    tkns.USDt, 
                    tkns.YUSD,
                    MaxDustWei
                )
            })
    
        })
    
        it('Query returns zero if tokens not found', async () => {
            const supportedTkn = tkns.USDt
            ate.checkQueryReturnsZeroForUnsupportedTkns(supportedTkn)
        })
    
        it('Gas-estimate is between max-gas-used and 110% max-gas-used', async () => {
            const options = [
                [ '1', tkns.YUSD, tkns.USDt ],
                [ '1', tkns.USDC, tkns.YUSD ],
                [ '1', tkns.USDt, tkns.USDC ],
            ]
            await ate.checkGasEstimateIsSensible(options)
        })

    })

    describe('usdc', () => {

        before(async () => {
            const contractName = 'CurvePlain128Adapter'
            const adapterArgs = [ 
                'CurveUSDCAdapter', 
                curvelikePools.CurveUSDC, 
                245_000
            ]
            ate = await testEnv.setAdapterEnv(contractName, adapterArgs)
        })

        describe('Swapping matches query', async () => {

            it('20 USDCe -> USDC', async () => {
                await ate.checkSwapMatchesQueryWithDust(
                    '20', 
                    tkns.USDCe, 
                    tkns.USDC,
                    MaxDustWei
                )
            })
            it('2333 USDC -> USDCe', async () => {
                await ate.checkSwapMatchesQueryWithDust(
                    '2333', 
                    tkns.USDC, 
                    tkns.USDCe,
                    MaxDustWei
                )
            })
    
        })
    
        it('Query returns zero if tokens not found', async () => {
            const supportedTkn = tkns.USDt
            ate.checkQueryReturnsZeroForUnsupportedTkns(supportedTkn)
        })
    
        it('Gas-estimate is between max-gas-used and 110% max-gas-used', async () => {
            const options = [
                [ '1', tkns.USDC, tkns.USDCe ],
                [ '1', tkns.USDCe, tkns.USDC ],
            ]
            await ate.checkGasEstimateIsSensible(options)
        })

    })

    describe('mim', () => {

        const MaxErrBps = 5

        before(async () => {
            const contractName = 'CurveMetaWithSwapperAdapter'
            const adapterArgs = [ 
                'CurveMimAdapter', 
                1_100_000,
                curvelikePools.CurveMim,
                curvelikePools.CurveAave,
                addresses.avalanche.other.curveMetaSwapper,
            ]
            ate = await testEnv.setAdapterEnv(contractName, adapterArgs)
        })

        describe('Swapping matches query :: 5 bps error', async () => {

            it('44444 MIM -> USDCe', async () => {
                await ate.checkSwapMatchesQueryWithDustWithErr(
                    '44444', 
                    tkns.MIM, 
                    tkns.USDCe,
                    MaxDustWei,
                    MaxErrBps,
                )
            })

            it('1 USDCe -> MIM', async () => {
                await ate.checkSwapMatchesQueryWithDustWithErr(
                    '1', 
                    tkns.USDCe, 
                    tkns.MIM,
                    MaxDustWei,
                    MaxErrBps, 
                )
            })

            it('3134 MIM -> USDTe', async () => {
                await ate.checkSwapMatchesQueryWithDustWithErr(
                    '3134', 
                    tkns.MIM, 
                    tkns.USDTe,
                    MaxDustWei,
                    MaxErrBps,
                )
            })

            it('20 USDTe -> MIM', async () => {
                await ate.checkSwapMatchesQueryWithDustWithErr(
                    '20', 
                    tkns.USDTe, 
                    tkns.MIM,
                    MaxDustWei,
                    MaxErrBps,
                )
            })
    
        })
    
        it('Query returns zero if tokens not found', async () => {
            const supportedTkn = tkns.MIM
            ate.checkQueryReturnsZeroForUnsupportedTkns(supportedTkn)
        })

        it('Query returns zero if both in&out token are underlying', async () => {
            const dy = await ate.query(
                ethers.utils.parseUnits('1', 6), 
                tkns.USDTe.address, 
                tkns.USDCe.address,
            )
            expect(dy).to.eq(0)
            
        })
    
        it('Gas-estimate is between max-gas-used and 110% max-gas-used', async () => {
            const options = [
                [ '1', tkns.MIM, tkns.USDTe ],
                [ '1', tkns.USDCe, tkns.MIM ],
                [ '1', tkns.MIM, tkns.USDCe ],
            ]
            await ate.checkGasEstimateIsSensible(options)
        })

    })

    describe('more', () => {

        const MaxErrBps = 5

        before(async () => {
            const contractName = 'CurveMetaWithSwapperAdapter'
            const adapterArgs = [ 
                'CurveMoreAdapter', 
                1_100_000,
                curvelikePools.CurveMore,
                curvelikePools.CurveAave,
                addresses.avalanche.other.curveMetaSwapper,
            ]
            ate = await testEnv.setAdapterEnv(contractName, adapterArgs)
        })

        describe('Swapping matches query :: 5 bps error', async () => {

            it('44444 MONEY -> USDCe', async () => {
                await ate.checkSwapMatchesQueryWithDustWithErr(
                    '44444', 
                    tkns.MONEY, 
                    tkns.USDCe,
                    MaxDustWei,
                    MaxErrBps,
                )
            })

            it('1 USDCe -> MONEY', async () => {
                await ate.checkSwapMatchesQueryWithDustWithErr(
                    '1', 
                    tkns.USDCe, 
                    tkns.MONEY,
                    MaxDustWei,
                    MaxErrBps, 
                )
            })

            it('3134 MONEY -> USDTe', async () => {
                await ate.checkSwapMatchesQueryWithDustWithErr(
                    '3134', 
                    tkns.MONEY, 
                    tkns.USDTe,
                    MaxDustWei,
                    MaxErrBps,
                )
            })

            it('20 USDTe -> MONEY', async () => {
                await ate.checkSwapMatchesQueryWithDustWithErr(
                    '20', 
                    tkns.USDTe, 
                    tkns.MONEY,
                    MaxDustWei,
                    MaxErrBps,
                )
            })
    
        })
    
        it('Query returns zero if tokens not found', async () => {
            const supportedTkn = tkns.MONEY
            ate.checkQueryReturnsZeroForUnsupportedTkns(supportedTkn)
        })

        it('Query returns zero if both in&out token are underlying', async () => {
            const dy = await ate.query(
                ethers.utils.parseUnits('1', 6), 
                tkns.USDTe.address, 
                tkns.USDCe.address,
            )
            expect(dy).to.eq(0)
            
        })
    
        it('Gas-estimate is between max-gas-used and 110% max-gas-used', async () => {
            const options = [
                [ '1', tkns.MONEY, tkns.USDTe ],
                [ '1', tkns.USDCe, tkns.MONEY ],
                [ '1', tkns.MONEY, tkns.USDCe ],
            ]
            await ate.checkGasEstimateIsSensible(options)
        })

    })

    describe('deusdc', () => {

        const MaxErrBps = 5

        before(async () => {
            const contractName = 'CurveMetaWithSwapperAdapter'
            const adapterArgs = [ 
                'CurveDeusdcAdapter', 
                1_100_000,
                curvelikePools.CurveDeUSDC,
                curvelikePools.CurveAave,
                addresses.avalanche.other.curveMetaSwapper,
            ]
            ate = await testEnv.setAdapterEnv(contractName, adapterArgs)
        })

        describe('Swapping matches query :: 5 bps error', async () => {

            it('44444 deUSDC -> USDCe', async () => {
                await ate.checkSwapMatchesQueryWithDustWithErr(
                    '44444', 
                    tkns.deUSDC, 
                    tkns.USDCe,
                    MaxDustWei,
                    MaxErrBps,
                )
            })

            it('1 USDCe -> deUSDC', async () => {
                await ate.checkSwapMatchesQueryWithDustWithErr(
                    '1', 
                    tkns.USDCe, 
                    tkns.deUSDC,
                    MaxDustWei,
                    MaxErrBps, 
                )
            })

            it('3134 deUSDC -> USDTe', async () => {
                await ate.checkSwapMatchesQueryWithDustWithErr(
                    '3134', 
                    tkns.deUSDC, 
                    tkns.USDTe,
                    MaxDustWei,
                    MaxErrBps,
                )
            })

            it('20 USDTe -> deUSDC', async () => {
                await ate.checkSwapMatchesQueryWithDustWithErr(
                    '20', 
                    tkns.USDTe, 
                    tkns.deUSDC,
                    MaxDustWei,
                    MaxErrBps,
                )
            })
    
        })
    
        it('Query returns zero if tokens not found', async () => {
            const supportedTkn = tkns.deUSDC
            ate.checkQueryReturnsZeroForUnsupportedTkns(supportedTkn)
        })

        it('Query returns zero if both in&out token are underlying', async () => {
            const dy = await ate.query(
                ethers.utils.parseUnits('1', 6), 
                tkns.USDTe.address, 
                tkns.USDCe.address,
            )
            expect(dy).to.eq(0)
            
        })
    
        it('Gas-estimate is between max-gas-used and 110% max-gas-used', async () => {
            const options = [
                [ '1', tkns.deUSDC, tkns.USDTe ],
                [ '1', tkns.USDCe, tkns.deUSDC ],
                [ '1', tkns.deUSDC, tkns.USDCe ],
            ]
            await ate.checkGasEstimateIsSensible(options)
        })

    })

})