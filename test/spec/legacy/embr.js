const { expect } = require("chai")
const { ethers } = require("hardhat")
const fixtures = require('../../fixtures')
const { parseUnits } = ethers.utils
const { assets, balancerlikePools } = require('../../addresses.json')
const { BigNumber } = require("ethers")
const { setERC20Bal } = require('../../helpers')

describe("BalancerlikeAdapter - Embr Finance", function () {
    let Adapter
    let Pool
    let Vault

    let balancerlikeAdapters
    let genNewAccount
    let tokenContracts
    let trader

    before(async () => {
        const fixSimple = await fixtures.simple()
        genNewAccount = fixSimple.genNewAccount
        tokenContracts = fixSimple.tokenContracts

        balancerlikeAdapters = await fixtures.balancerlikeAdapters()
        Adapter = balancerlikeAdapters.EmbrAdapter
        Vault = balancerlikeAdapters.EmbrVault
    })

    beforeEach(async () => {
        trader = genNewAccount()
    })

    describe('Add & remove pools', async () => {
        const pools = [balancerlikePools.embrAVEWAVAX, balancerlikePools.embrMIMAUSD, balancerlikePools.embrAUSDWAVAX]

        it('Remove pools from adapter', async () => {
            Adapter.removePools(pools)
            await expect(testSwappingMatchesQuery(tokenContracts.AUSD, tokenContracts.WAVAX, parseUnits("100", 18))).to.be.revertedWith('Undefined pool')
        })

        it('Add pools to adapter', async () => {
            Adapter.addPools(pools)
            await testSwappingMatchesQuery(tokenContracts.AUSD, tokenContracts.WAVAX, parseUnits("100", 18))
        })
    })

    describe('AUSD / WAVAX pool', async () => {
        before(async () => {
            Pool = balancerlikeAdapters.EmbrAUSDWAVAX
        })

        it('Querying adapter matches the price from original contract', async () => {
            const amountIn = parseUnits("100", 18)
            await testAdapterQueryMatchesOriginalContractQuery(amountIn, assets.AUSD, assets.WAVAX)
        })

        it('Swapping matches query', async () => {
            const tokenFrom = tokenContracts.AUSD
            const tokenTo = tokenContracts.WAVAX
            const amountIn = parseUnits('12500', 18)
            await testSwappingMatchesQuery(tokenFrom, tokenTo, amountIn);
        })

        it('Query should return zero if tokenIn is not in pool', async () => {
            const amountOut = await Adapter.query(parseUnits("100", 18), assets.FRAX, assets.WAVAX)
            expect(amountOut).to.equal(0)
        })

        it('Query should return zero if tokenOut is not in pool', async () => {
            const amountOut = await Adapter.query(parseUnits("100", 18), assets.AUSD, assets.FRAX)
            expect(amountOut).to.equal(0)
        })

        it('Query should return zero if tokenIn equals tokenOut', async () => {
            const amountOut = await Adapter.query(parseUnits("10", 18), assets.WAVAX, assets.WAVAX)
            expect(amountOut).to.equal(0)
        })

        it('Query should return zero if amountIn equals zero', async () => {
            const amountOut = await Adapter.query(0, assets.AUSD, assets.WAVAX)
            expect(amountOut).to.equal(0)
        })

        it('Check gas cost', async () => {
            const tokenFrom = tokenContracts.AUSD
            const tokenTo = tokenContracts.WAVAX
            const amountIn = parseUnits('5000', await tokenFrom.decimals())
            await itChecksGasCost(tokenFrom, tokenTo, amountIn)
        })
    })

    describe('USDC / USDC.e / WAVAX pool', async => {
        before(async () => {
            Pool = balancerlikeAdapters.EmbrUSDCUSDCeWAVAX
        })

        it('Querying adapter matches the price from original contract', async () => {
            const amountIn = parseUnits("500", 6)
            await testAdapterQueryMatchesOriginalContractQuery(amountIn, assets.USDCe, assets.WAVAX)
        })

        it('Swapping matches query', async () => {
            const tokenFrom = tokenContracts.WAVAX
            const tokenTo = tokenContracts.USDCe
            const amountIn = parseUnits('11.559342', 18)
            await testSwappingMatchesQuery(tokenFrom, tokenTo, amountIn);
        })

        it('Check gas cost', async () => {
            const tokenFrom = tokenContracts.USDCe
            const tokenTo = tokenContracts.WAVAX
            const amountIn = parseUnits('11111.32', await tokenFrom.decimals())
            await itChecksGasCost(tokenFrom, tokenTo, amountIn)
        })
    })

    describe('AUSD <--> AVE', async => {
        before(async () => {
            Pool = balancerlikeAdapters.EmbrAUSDAVE
        })

        it('Querying adapter returns the price from the best pool', async () => {
            const amountIn = parseUnits("500", 18)
            // Two pools can execute the swap: AUSDC / AVE pool or AUSD / AVE / BLUE / EMBR / CABAG
            // The adapter should return the highest query
            await testAdapterQueryMatchesOriginalContractQuery(amountIn, assets.AUSD, assets.AVE)
        })

        it('Swapping matches query', async () => {
            const tokenFrom = tokenContracts.AVE
            const tokenTo = tokenContracts.AUSD
            const amountIn = parseUnits('1000', 18)
            await testSwappingMatchesQuery(tokenFrom, tokenTo, amountIn);
        })
    })

    async function testAdapterQueryMatchesOriginalContractQuery(amountIn, tokenIn, tokenOut) {
        // Get adapter query
        const amountOutAdapter = await Adapter.query(amountIn, tokenIn, tokenOut)

        // Get original contract query
        const kind = 0
        const swapAssets = [tokenIn, tokenOut]
        const funds = {
            sender: trader.address,
            recipient: trader.address,
        }
        const poolId = await Pool.getPoolId()
        const swaps = [
            {
                poolId: poolId,
                assetInIndex: '0',
                assetOutIndex: '1',
                amount: amountIn,
                userData: '0x',
            },
        ]
        const args = [kind, swaps, swapAssets, funds]
        const queryBatchSwapResult = await Vault.callStatic.queryBatchSwap(...args)
        const amountOutOriginal = queryBatchSwapResult[1].mul(BigNumber.from(-1))

        expect(amountOutOriginal).to.equal(amountOutAdapter)
    }

    async function testSwappingMatchesQuery(tokenFrom, tokenTo, amountIn) {
        // Querying adapter 
        const amountOutQuery = await Adapter.query(
            amountIn,
            tokenFrom.address,
            tokenTo.address
        )
        // Mint tokens to adapter address
        await setERC20Bal(tokenFrom.address, Adapter.address, amountIn)
        expect(await tokenFrom.balanceOf(Adapter.address)).to.equal(amountIn)
        // Swapping
        const swap = () => Adapter.connect(trader).swap(
            amountIn,
            amountOutQuery,
            tokenFrom.address,
            tokenTo.address,
            trader.address
        )
        // Check that swap matches the query
        await expect(swap).to.changeTokenBalance(tokenTo, trader, amountOutQuery)
    }

    async function itChecksGasCost(tokenFrom, tokenTo, amountIn) {
        let maxGas = 0
        // Mint tokens to adapter address
        await setERC20Bal(tokenFrom.address, Adapter.address, amountIn)
        expect(await tokenFrom.balanceOf(Adapter.address)).to.gte(amountIn)
        // Querying
        const queryTx = await Adapter.populateTransaction.query(
            amountIn,
            tokenFrom.address,
            tokenTo.address
        )
        const queryGas = await ethers.provider.estimateGas(queryTx)
            .then(parseInt)
        // Swapping
        const swapGas = await Adapter.connect(trader).swap(
            amountIn,
            1,
            tokenFrom.address,
            tokenTo.address,
            trader.address
        ).then(tr => tr.wait()).then(r => parseInt(r.gasUsed))
        console.log(`swap-gas:${swapGas} | query-gas:${queryGas}`)
        const gasUsed = swapGas + queryGas
        if (gasUsed > maxGas) {
            maxGas = gasUsed
        }
        // Check that gas estimate is above max, but below 10% of max
        const estimatedGas = await Adapter.swapGasEstimate().then(parseInt)
        expect(estimatedGas).to.be.within(maxGas, maxGas * 1.1)
    }
})