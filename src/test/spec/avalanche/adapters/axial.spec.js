const { setTestEnv, addresses } = require('../../../utils/test-env')
const { curvelikePools } = addresses.avalanche


describe('YakAdapter - Axial', () => {
    
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

    describe('AM3D', () => {

        before(async () => {
            const contractName = 'SaddleAdapter'
            const adapterArgs = [ 
                'AxialAM3DAdapter', 
                curvelikePools.AxialAM3D, 
                320_000
            ]
            ate = await testEnv.setAdapterEnv(contractName, adapterArgs)
        })

        describe('Swapping matches query', async () => {

            it('1000000 USDCe -> MIM', async () => {
                await ate.checkSwapMatchesQuery('1000000', tkns.USDCe, tkns.MIM)
            })
            it('1000000 MIM -> USDCe', async () => {
                await ate.checkSwapMatchesQuery('1000000', tkns.MIM, tkns.USDCe)
            })
            it('3333 DAIe -> USDCe', async () => {
                await ate.checkSwapMatchesQuery('3333', tkns.DAIe, tkns.USDCe)
            })
            it('3 MIM -> DAIe', async () => {
                await ate.checkSwapMatchesQuery('3', tkns.MIM, tkns.DAIe)
            })
    
        })
    
        it('Query returns zero if tokens not found', async () => {
            const supportedTkn = tkns.MIM
            ate.checkQueryReturnsZeroForUnsupportedTkns(supportedTkn)
        })
    
        it('Gas-estimate is between max-gas-used and 110% max-gas-used', async () => {
            const options = [
                [ '1', tkns.USDCe, tkns.DAIe ],
                [ '1', tkns.DAIe, tkns.MIM ],
                [ '1', tkns.MIM, tkns.USDCe ],
                [ '1', tkns.MIM, tkns.DAIe ],
            ]
            await ate.checkGasEstimateIsSensible(options)
        })

    })

    describe('AS4D', () => {

        before(async () => {
            const contractName = 'SaddleAdapter'
            const adapterArgs = [ 
                'AxialAS4DAdapter', 
                curvelikePools.AxialAS4D, 
                330_000
            ]
            ate = await testEnv.setAdapterEnv(contractName, adapterArgs)
        })

        describe('Swapping matches query', async () => {

            it('1 TUSD -> USDCe', async () => {
                await ate.checkSwapMatchesQuery('1', tkns.TUSD, tkns.USDCe)
            })
            it('3 USDCe -> TUSD', async () => {
                await ate.checkSwapMatchesQuery('3', tkns.USDCe, tkns.TUSD)
            })
            it('1000000 DAIe -> USDTe', async () => {
                await ate.checkSwapMatchesQuery('1000000', tkns.DAIe, tkns.USDTe)
            })
            it('22222 DAIe -> TUSD', async () => {
                await ate.checkSwapMatchesQuery('22222', tkns.DAIe, tkns.TUSD)
            })
            it('11 TUSD -> USDTe', async () => {
                await ate.checkSwapMatchesQuery('11', tkns.TUSD, tkns.USDTe)
            })
    
        })
    
        it('Query returns zero if tokens not found', async () => {
            const supportedTkn = tkns.DAIe
            ate.checkQueryReturnsZeroForUnsupportedTkns(supportedTkn)
        })
    
        it('Gas-estimate is between max-gas-used and 110% max-gas-used', async () => {
            const options = [
                [ '1', tkns.USDCe, tkns.DAIe ],
                [ '1', tkns.DAIe, tkns.USDTe ],
                [ '1', tkns.USDTe, tkns.USDCe ],
                [ '1', tkns.USDTe, tkns.DAIe ],
                [ '1', tkns.USDCe, tkns.TUSD ],
                [ '1', tkns.TUSD, tkns.DAIe ],
            ]
            await ate.checkGasEstimateIsSensible(options)
        })

    })


})