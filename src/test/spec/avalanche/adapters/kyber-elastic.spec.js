const { expect } = require('chai')
const { setTestEnv, addresses } = require('../../../utils/test-env')
const { kyberElastic } = addresses.avalanche


describe('YakAdapter - KyberElastic', function() {
    
    let testEnv
    let tkns
    let ate // adapter-test-env

    before(async () => {
        const networkName = 'avalanche'
        const forkBlockNumber = 20030871
        testEnv = await setTestEnv(networkName, forkBlockNumber)
        tkns = testEnv.supportedTkns

        const contractName = 'KyberElasticAdapter'
        const gasEstimate = 210_000
        const quoterGasLimit = gasEstimate
        const adapterArgs = [ 
            'KyberElasticAdapter', 
            gasEstimate,
            quoterGasLimit,
            kyberElastic.quoter, 
            Object.values(kyberElastic.pools), 
        ]
        ate = await testEnv.setAdapterEnv(contractName, adapterArgs)
    })

    beforeEach(async () => {
        testEnv.updateTrader()
    })

    describe('Swapping matches query', async () => {

        it('100 SAVAX -> WAVAX', async () => {
            await ate.checkSwapMatchesQuery('100', tkns.SAVAX, tkns.WAVAX)
        })
        it('100 WAVAX -> SAVAX', async () => {
            await ate.checkSwapMatchesQuery('100', tkns.WAVAX, tkns.SAVAX)
        })
        it('100 YUSD -> USDC', async () => {
            await ate.checkSwapMatchesQuery('100', tkns.YUSD, tkns.USDC)
        })
        it('3000 SAVAX -> YUSD', async () => {
            await ate.checkSwapMatchesQuery('300', tkns.SAVAX, tkns.YUSD)
        })
        it('100 USDt -> USDC', async () => {
            await ate.checkSwapMatchesQuery('100', tkns.USDt, tkns.USDC)
        })
        it('100 USDC -> USDTe', async () => {
            await ate.checkSwapMatchesQuery('100', tkns.USDC, tkns.USDt)
        })

    })

    it('Swapping too much returns zero', async () => {
        const dy = await ate.Adapter.query(
            ethers.utils.parseUnits('100000000', 6),
            tkns.USDC.address,
            tkns.USDt.address
        )
        expect(dy).to.eq(0)
    })

    it('Adapter can only spend max-gas + buffer', async () => {
        const gasBuffer = ethers.BigNumber.from('50000')
        const quoterGasLimit = await ate.Adapter.quoterGasLimit()
        const dy = await ate.Adapter.estimateGas.query(
            ethers.utils.parseUnits('1000000', 18),
            tkns.YUSD.address,
            tkns.SAVAX.address
        )
        expect(dy).to.lt(quoterGasLimit.add(gasBuffer))
    })

    it('Query returns zero if tokens not found', async () => {
        const supportedTkn = tkns.USDC
        await ate.checkQueryReturnsZeroForUnsupportedTkns(supportedTkn)
    })

    it('Gas-estimate is between max-gas-used and 110% max-gas-used', async () => {
        const options = [
            [ '100', tkns.SAVAX, tkns.WAVAX ],
            [ '100', tkns.YUSD, tkns.SAVAX ],
            [ '100', tkns.USDC, tkns.USDt ],
            [ '100', tkns.USDt, tkns.DAIe ],
        ]
        await ate.checkGasEstimateIsSensible(options)
    })

})