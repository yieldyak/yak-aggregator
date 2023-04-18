const { expect } = require('chai')
const { setTestEnv, addresses } = require('../../../utils/test-env')
const { camelot, other } = addresses.arbitrum


describe('YakAdapter - CamelotAlgebra', function() {
    
    let testEnv
    let tkns
    let ate // adapter-test-env

    before(async () => {
        const networkName = 'arbitrum'
        const forkBlockNumber = 79470362
        testEnv = await setTestEnv(networkName, forkBlockNumber)
        tkns = testEnv.supportedTkns

        const contractName = 'AlgebraAdapter'
        const gasEstimate = 350_000
        const quoterGasLimit = gasEstimate
        const adapterArgs = [ 
            'CamelotAlgebra', 
            gasEstimate, 
            quoterGasLimit,
            other.algebraQuoter, 
            camelot.algebraFactory, 
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
        it('100 USDT -> USDC', async () => {
            await ate.checkSwapMatchesQuery('100', tkns.USDT, tkns.USDC)
        })
        it('10 ARB -> WETH', async () => {
            await ate.checkSwapMatchesQuery('10', tkns.ARB, tkns.WETH)
        })

    })

    it('Query returns zero if tokens not found', async () => {
        const supportedTkn = tkns.WETH
        await ate.checkQueryReturnsZeroForUnsupportedTkns(supportedTkn)
    })

    it('Swapping too much returns zero', async () => {
        const dy = await ate.Adapter.query(
            ethers.utils.parseUnits('1000000000', 18),
            tkns.WETH.address,
            tkns.ARB.address
        )
        expect(dy).to.eq(0)
    })

    it('Adapter can only spend max-gas + buffer', async () => {
        const gasBuffer = ethers.BigNumber.from('50000')
        const quoterGasLimit = await ate.Adapter.quoterGasLimit()
        const dy = await ate.Adapter.estimateGas.query(
            ethers.utils.parseUnits('1000000', 6),
            tkns.USDC.address,
            tkns.USDT.address
        )
        expect(dy).to.lt(quoterGasLimit.add(gasBuffer))
    })

    it('Gas-estimate is between max-gas-used and 110% max-gas-used', async () => {
        const options = [
            [ '1', tkns.USDC, tkns.WETH ],
            [ '1', tkns.USDT, tkns.USDC ],
            [ '1', tkns.WETH, tkns.ARB ],
        ]
        await ate.checkGasEstimateIsSensible(options)
    })

})