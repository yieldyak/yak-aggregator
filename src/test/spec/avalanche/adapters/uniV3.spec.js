const { expect } = require('chai')
const { ethers } = require('hardhat')
const { setTestEnv, addresses } = require('../../../utils/test-env')
const { uniV3 } = addresses.avalanche


describe('YakAdapter - UniswapV3', function() {
    
    let testEnv
    let tkns
    let ate // adapter-test-env

    before(async () => {
        const networkName = 'avalanche'
        const forkBlockNumber = 32551153
        testEnv = await setTestEnv(networkName, forkBlockNumber)
        tkns = testEnv.supportedTkns

        const contractName = 'UniswapV3Adapter'
        const gasEstimate = 260_000
        const quoterGasLimit = gasEstimate
        const defaultFees = [500, 3_000, 10_000]
        const adapterArgs = [ 
            'UniswapV3Adapter', 
            gasEstimate,
            quoterGasLimit,
            uniV3.quoter, 
            uniV3.factory,
            defaultFees
        ]
        ate = await testEnv.setAdapterEnv(contractName, adapterArgs)
    })

    beforeEach(async () => {
        testEnv.updateTrader()
    })

    describe('Swapping matches query', async () => {

        it('50 USDC -> BTC.b', async () => {
            await ate.checkSwapMatchesQuery('50', tkns.USDC, tkns.BTCb)
        })

        it('200 USDC -> WAVAX', async () => {
            await ate.checkSwapMatchesQuery('200', tkns.USDC, tkns.WAVAX)
        })

    })

    it('Query returns zero if tokens not found', async () => {
        const supportedTkn = tkns.USDC
        ate.checkQueryReturnsZeroForUnsupportedTkns(supportedTkn)
    })

    it('Swapping too much returns zero', async () => {
        const dy = await ate.Adapter.query(
            ethers.utils.parseUnits('10000', 18),
            tkns.USDC.address,
            tkns.WAVAX.address
        )
        expect(dy).to.eq(0)
    })

    it('Adapter can only spend max-gas + buffer', async () => {
        const gasBuffer = ethers.BigNumber.from('70000')
        const quoterGasLimit = await ate.Adapter.quoterGasLimit()
        const dy = await ate.Adapter.estimateGas.query(
            ethers.utils.parseUnits('2000', 6),
            tkns.USDC.address,
            tkns.WAVAX.address
        )
        expect(dy).to.lt(quoterGasLimit.add(gasBuffer))
    })

    it('Gas-estimate is between max-gas-used and 110% max-gas-used', async () => {
        const options = [
            [ '10', tkns.USDC, tkns.WAVAX ],
            [ '10', tkns.USDC, tkns.BTCb ],
        ]
        await ate.checkGasEstimateIsSensible(options)
    })

})