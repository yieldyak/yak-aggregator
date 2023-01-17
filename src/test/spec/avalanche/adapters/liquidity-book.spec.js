const { expect } = require('chai')
const { setTestEnv, addresses } = require('../../../utils/test-env')
const { liquidityBook } = addresses.fuji


describe('YakAdapter - LiquidityBook', function() {
    
    let testEnv
    let tkns
    let ate // adapter-test-env

    beforeEach(async () => {
        const networkName = 'fuji'
        const forkBlockNumber = 15088489
        testEnv = await setTestEnv(networkName, forkBlockNumber)
        tkns = testEnv.supportedTkns

        const contractName = 'LBAdapter'
        const gasEstimate = 535_345
        const adapterArgs = [ 
            'LiquidityBookAdapter', 
            gasEstimate,
            liquidityBook.router,
        ]
        ate = await testEnv.setAdapterEnv(contractName, adapterArgs)
    })

    describe('Swapping matches query', async () => {

        it('1000 USDC -> WAVAX', async () => {
            await ate.checkSwapMatchesQuery('1000', tkns.USDC, tkns.WAVAX)
        })
        it('100 WAVAX -> USDC', async () => {
            await ate.checkSwapMatchesQuery('100', tkns.WAVAX, tkns.USDC)
        })
        it('0.033 USDT -> USDC', async () => {
            await ate.checkSwapMatchesQuery('0.033', tkns.USDT, tkns.USDC)
        })
        it('30000 USDC -> USDT', async () => {
            await ate.checkSwapMatchesQuery('30000', tkns.USDC, tkns.USDT)
        })

    })

    it('Swapping too much returns zero', async () => {
        const dy = await ate.Adapter.query(
            ethers.utils.parseUnits('100000000', 6),
            tkns.USDC.address,
            tkns.USDT.address
        )
        expect(dy).to.eq(0)
    })

    it('Adapter can only spend max-gas + buffer', async () => {
        const gasBuffer = ethers.BigNumber.from('50000')
        const quoteGasLimit = await ate.Adapter.quoteGasLimit()
        const dy = await ate.Adapter.estimateGas.query(
            ethers.utils.parseUnits('1000000', 18),
            tkns.USDC.address,
            tkns.USDT.address
        )
        expect(dy).to.lt(quoteGasLimit.add(gasBuffer))
    })

    it('Query returns zero if tokens not found', async () => {
        const supportedTkn = tkns.USDC
        await ate.checkQueryReturnsZeroForUnsupportedTkns(supportedTkn)
    })

    it('Gas-estimate is between max-gas-used and 110% max-gas-used', async () => {
        const options = [
            [ '1', tkns.USDC, tkns.WAVAX ],
            [ '1000', tkns.WAVAX, tkns.USDC ],
            [ '20000', tkns.USDC, tkns.USDT ],
            [ '30000', tkns.USDT, tkns.USDC ],
        ]
        await ate.checkGasEstimateIsSensible(options)
    })

})