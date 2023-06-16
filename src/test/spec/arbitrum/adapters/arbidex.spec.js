const { expect } = require('chai')
const { ethers } = require('hardhat')
const { setTestEnv, addresses } = require('../../../utils/test-env')
const { arbidex } = addresses.arbitrum


describe('YakAdapter - ArbiDex', function() {
    
    let testEnv
    let tkns
    let ate // adapter-test-env

    before(async () => {
        const networkName = 'arbitrum'
        const forkBlockNumber = 101695972
        testEnv = await setTestEnv(networkName, forkBlockNumber)
        tkns = testEnv.supportedTkns

        const contractName = 'UniswapV3Adapter'
        const gasEstimate = 270_000
        const quoterGasLimit = gasEstimate
        const defaultFees = [80, 450, 2_500, 10_000]
        const adapterArgs = [ 
            'ArbiDexAdapter', 
            gasEstimate,
            quoterGasLimit,
            arbidex.quoter, 
            arbidex.factory,
            defaultFees
        ]
        ate = await testEnv.setAdapterEnv(contractName, adapterArgs)
    })

    beforeEach(async () => {
        testEnv.updateTrader()
    })

    describe('Swapping matches query', async () => {

        it('100 DAI -> USDC', async () => {
            await ate.checkSwapMatchesQuery('100', tkns.DAI, tkns.USDC)
        })
        it('100 USDC -> WETH', async () => {
            await ate.checkSwapMatchesQuery('100', tkns.USDC, tkns.WETH)
        })
        it('100 USDC -> USDT', async () => {
            await ate.checkSwapMatchesQuery('100', tkns.USDC, tkns.USDT)
        })
        it('100 USDC -> DAI', async () => {
            await ate.checkSwapMatchesQuery('100', tkns.USDC, tkns.DAI)
        })
        it('100 WETH -> WBTC', async () => {
            await ate.checkSwapMatchesQuery('100', tkns.WETH, tkns.WBTC)
        })

    })

    it('Most liquid pool offers best quote', async () => {
        const tknIn = tkns.DAI.address
        const tknOut = tkns.USDC.address
        const dx = ethers.utils.parseUnits('1', 18)

        const cAdapter = ate.Adapter
        const cFactory = await ethers.getContractAt('IUniV3Factory', arbidex.factory)
        const feeOptions = [80, 450, 2_500, 10_000].map(f => ethers.BigNumber.from(f.toString()))

        let bestQuote = ethers.constants.Zero
        for (let fee of feeOptions) {
            const pool = await cFactory.getPool(tknIn, tknOut, fee)
            if (pool == ethers.constants.AddressZero)
                continue
            const quote = await cAdapter.getQuoteForPool(pool, dx, tknIn, tknOut)
            if (quote.gt(bestQuote))
                bestQuote = quote
        }

        const adapterQuote = await cAdapter.query(dx, tknIn, tknOut)

        expect(adapterQuote).to.eq(bestQuote)
    })

    it('Query returns zero if tokens not found', async () => {
        const supportedTkn = tkns.WBTC
        ate.checkQueryReturnsZeroForUnsupportedTkns(supportedTkn)
    })

    it('Swapping too much returns zero', async () => {
        const dy = await ate.Adapter.query(
            ethers.utils.parseUnits('10000', 18),
            tkns.WETH.address,
            tkns.WBTC.address
        )
        expect(dy).to.eq(0)
    })

    it('Adapter can only spend max-gas + buffer', async () => {
        const gasBuffer = ethers.BigNumber.from('70000')
        const quoterGasLimit = await ate.Adapter.quoterGasLimit()
        const dy = await ate.Adapter.estimateGas.query(
            ethers.utils.parseUnits('1000000', 6),
            tkns.USDC.address,
            tkns.WETH.address
        )
        expect(dy).to.lt(quoterGasLimit.add(gasBuffer))
    })

    it('Gas-estimate is between max-gas-used and 110% max-gas-used', async () => {
        const options = [
            [ '100', tkns.USDC, tkns.WETH ],
            [ '100', tkns.USDC, tkns.DAI ],
            [ '100', tkns.USDT, tkns.USDC ],
        ]
        await ate.checkGasEstimateIsSensible(options)
    })

})