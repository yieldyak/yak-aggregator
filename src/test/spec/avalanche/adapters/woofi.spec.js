const { expect } = require('chai')
const { setTestEnv, addresses } = require('../../../utils/test-env')
const { WoofiPoolUSDC } = addresses.avalanche.other

describe('YakAdapter - woofi', () => {
    
    let testEnv
    let tkns
    let ate // adapter-test-env

    before(async () => {
        const networkName = 'avalanche'
        const forkBlockNumber = 19595355
        testEnv = await setTestEnv(networkName, forkBlockNumber)
        tkns = testEnv.supportedTkns

        const contractName = 'WoofiAdapter'
        const adapterArgs = [
            'WoofiAdapter',
            525_000,
            WoofiPoolUSDC,
        ]
        ate = await testEnv.setAdapterEnv(contractName, adapterArgs)
    })

    beforeEach(async () => {
        testEnv.updateTrader()
    })

    describe('Swapping matches query :: base->quote', async () => {

        it('1 WAVAX -> USDC', async () => {
            await ate.checkSwapMatchesQuery('1', tkns.WAVAX, tkns.USDC)
        })
        it('1 WETHe -> USDC', async () => {
            await ate.checkSwapMatchesQuery('1', tkns.WETHe, tkns.USDC)
        })
        it('1 BTCb -> USDC', async () => {
            await ate.checkSwapMatchesQuery('1', tkns.BTCb, tkns.USDC)
        })
        it('1 WOO -> USDC', async () => {
            await ate.checkSwapMatchesQuery('1', tkns.WOO, tkns.USDC)
        })
        
    })

    describe('Swapping matches query :: base->quote', async () => {

        it('1 USDC -> WAVAX', async () => {
            await ate.checkSwapMatchesQuery('1', tkns.USDC, tkns.WAVAX)
        })
        it('1 USDC -> WETHe', async () => {
            await ate.checkSwapMatchesQuery('1', tkns.USDC, tkns.WETHe)
        })
        it('1 USDC -> BTCb', async () => {
            await ate.checkSwapMatchesQuery('1', tkns.USDC, tkns.BTCb)
        })
        it('1 USDC -> WOO', async () => {
            await ate.checkSwapMatchesQuery('1', tkns.USDC, tkns.WOO)
        })
        
    })

    describe('Swapping matches query :: base->base', async () => {

        it('100 WAVAX -> WETHe', async () => {
            await ate.checkSwapMatchesQuery('100', tkns.WAVAX, tkns.WETHe)
        })
        it('1 WETHe -> BTCb :: 1 bps err', async () => {
            const errBps = 1
            await ate.checkSwapMatchesQueryWithErr(
                '1', 
                tkns.WETHe, 
                tkns.BTCb,
                errBps
            )
        })
        it('0.01 BTCb -> USDC', async () => {
            await ate.checkSwapMatchesQuery('0.01', tkns.BTCb, tkns.USDC)
        })
        it('100 USDC -> WAVAX', async () => {
            await ate.checkSwapMatchesQuery('100', tkns.USDC, tkns.WAVAX)
        })
        
    })

    it('Query returns zero if tokens not found', async () => {
        const supportedTkn = tkns.USDC
        ate.checkQueryReturnsZeroForUnsupportedTkns(supportedTkn)
    })

    it('Gas-estimate is between max-gas-used and 110% max-gas-used', async () => {
        const options = [
            [ '1', tkns.USDC, tkns.BTCb ],
            [ '1', tkns.BTCb, tkns.WAVAX ],
            [ '1', tkns.WAVAX, tkns.WETHe ],
            [ '1', tkns.WETHe, tkns.USDC ],
        ]
        await ate.checkGasEstimateIsSensible(options)
    })

})