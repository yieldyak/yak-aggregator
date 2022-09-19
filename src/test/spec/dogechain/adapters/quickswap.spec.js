const { expect } = require('chai')
const { setTestEnv, addresses } = require('../../../utils/test-env')
const { quickswap } = addresses.dogechain


describe('YakAdapter - Quickswap', function() {
    
    let testEnv
    let tkns
    let ate // adapter-test-env

    before(async () => {
        const networkName = 'dogechain'
        const forkBlockNumber = 2319084
        testEnv = await setTestEnv(networkName, forkBlockNumber)
        tkns = testEnv.supportedTkns

        const contractName = 'AlgebraAdapter'
        const gasEstimate = 410_000
        const quoterGasLimit = gasEstimate
        const adapterArgs = [ 
            'QuickswapAdapter', 
            gasEstimate, 
            quoterGasLimit,
            quickswap.algebraQuoter, 
            quickswap.quickswapFactory, 
        ]
        ate = await testEnv.setAdapterEnv(contractName, adapterArgs)
    })

    beforeEach(async () => {
        testEnv.updateTrader()
    })

    describe('Swapping matches query', async () => {

        it('100 USDC -> WWDOGE', async () => {
            await ate.checkSwapMatchesQuery('100', tkns.USDC, tkns.WWDOGE)
        })
        it('100 WWDOGE -> USDC', async () => {
            await ate.checkSwapMatchesQuery('100', tkns.WWDOGE, tkns.USDC)
        })
        it('1 ETH -> USDC', async () => {
            await ate.checkSwapMatchesQuery('1', tkns.ETH, tkns.USDC)
        })
        it('100 WWDOGE -> DC', async () => {
            await ate.checkSwapMatchesQuery('100', tkns.WWDOGE, tkns.DC)
        })
        it('100 DC -> WWDOGE', async () => {
            await ate.checkSwapMatchesQuery('100', tkns.DC, tkns.WWDOGE)
        })

    })

    it('Query returns zero if tokens not found', async () => {
        const supportedTkn = tkns.ETH
        await ate.checkQueryReturnsZeroForUnsupportedTkns(supportedTkn)
    })

    it('Swapping too much returns zero', async () => {
        const dy = await ate.Adapter.query(
            ethers.utils.parseUnits('10000000', 18),
            tkns.ETH.address,
            tkns.USDC.address
        )
        expect(dy).to.eq(0)
    })

    it('Adapter can only spend max-gas + buffer', async () => {
        const gasBuffer = ethers.BigNumber.from('50000')
        const quoterGasLimit = await ate.Adapter.quoterGasLimit()
        const dy = await ate.Adapter.estimateGas.query(
            ethers.utils.parseUnits('1000000', 6),
            tkns.USDC.address,
            tkns.WWDOGE.address
        )
        expect(dy).to.lt(quoterGasLimit.add(gasBuffer))
    })

    it('Gas-estimate is between max-gas-used and 110% max-gas-used', async () => {
        const options = [
            [ '1', tkns.USDC, tkns.ETH ],
            [ '1', tkns.WWDOGE, tkns.USDC ],
            [ '1', tkns.DC, tkns.WWDOGE ],
        ]
        await ate.checkGasEstimateIsSensible(options)
    })

})