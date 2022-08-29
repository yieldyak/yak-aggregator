const { expect } = require("chai")
const { ethers } = require("hardhat")
const { parseUnits } = ethers.utils

const { setERC20Bal, getTokenContract, approveERC20 } = require('../../helpers')
const fix = require('../../fixtures')

describe("YakAdapter - WooFi", function() {

    let quoteToken 
    let Original
    let Adapter

    let genNewAccount
    let trader
    let tkns

    before(async () => {
        const fixSimple = await fix.simple()
        const fixCurve = await fix.woofiAdapter()
        Adapter = fixCurve.WoofiAdapter
        Original = fixCurve.WoofiPool
        tkns = fixSimple.tokenContracts
        genNewAccount = fixSimple.genNewAccount
        quoteToken = await Original.quoteToken().then(getTokenContract)

        Object.keys(tkns).forEach(tknSymbol => {
            hre.tracer.nameTags[tkns[tknSymbol].address] = tknSymbol
        })
        hre.tracer.nameTags[Adapter.address] = 'WoofiAdapter'
        hre.tracer.nameTags[Original.address] = 'WooPP'

    })

    beforeEach(async () => {
        trader = genNewAccount()
    })

    async function queryMatchesSwapping(tokenFrom, tokenTo, amountIn) {
        // Querying adapter 
        const amountOutQuery = await Adapter.query(
            amountIn, 
            tokenFrom.address, 
            tokenTo.address
        )
        expect(amountOutQuery).to.gt(0)
        // Mint tokens to adapter address
        await setERC20Bal(tokenFrom.address, Adapter.address, amountIn)
        // Swapping
        const swap = () => Adapter.connect(trader).swap(
            amountIn, 
            amountOutQuery,
            tokenFrom.address,
            tokenTo.address, 
            trader.address
        )
        await expect(swap).to.changeTokenBalances(
            tokenTo, 
            [trader, Adapter], 
            [amountOutQuery, ethers.constants.Zero]
        )
        return amountOutQuery
    }

    describe('base -> quote', async () => {

        let tokenTo

        before(() => {
            tokenTo = quoteToken
        })

        it('Return zero for non-supported tokens', async () => {
            // Options
            const tokenFrom = tkns.YAK
            const amountIn = parseUnits('1', await tokenFrom.decimals())
            // Querying adapter 
            const amountOutQuery = await Adapter.query(
                amountIn, 
                tokenFrom.address, 
                tokenTo.address
            )
            expect(amountOutQuery).to.equal(0)
        })

        it('Return zero if amount too low', async () => {
            const tokenFrom = tkns.WAVAX
            const amountIn = parseUnits('0.00001', await tokenFrom.decimals())
            
            const queryOrg = () => Original.querySellBase(
                tokenFrom.address, 
                amountIn
            )
            await expect(queryOrg()).to.revertedWith('WooGuardian: inputAmount_LTM')
            const queryAdapter = await Adapter.query(
                amountIn, 
                tokenFrom.address, 
                tokenTo.address
            )
            expect(queryAdapter).to.equal(0)
        })

        it('Return zero if amount gt than reserves', async () => {
            const tokenFrom = tkns.WAVAX
            const amountIn = parseUnits('1000000000', await tokenFrom.decimals())
            
            const queryOrg = () => Original.querySellBase(
                tokenFrom.address, 
                amountIn
            )
            await expect(queryOrg()).to.revertedWith('WooGuardian: inputAmount_GTM')
            const queryAdapter = await Adapter.query(
                amountIn, 
                tokenFrom.address, 
                tokenTo.address
            )
            expect(queryAdapter).to.equal(0)
        })

        it('Query matches swapping - normal', async () => {
            const tokenFrom = tkns.WAVAX
            const amountIn = parseUnits('100', await tokenFrom.decimals())
            await queryMatchesSwapping(tokenFrom, tokenTo, amountIn)
        })

        it('Query matches swapping - low', async () => {
            const tokenFrom = tkns.WOO
            const amountIn = parseUnits('0.016', await tokenFrom.decimals())
            await queryMatchesSwapping(tokenFrom, tokenTo, amountIn)
        })

        it('Query matches swapping - high', async () => {
            const tokenFrom = tkns.WAVAX
            const amountIn = parseUnits('1000', await tokenFrom.decimals())
            await queryMatchesSwapping(tokenFrom, tokenTo, amountIn)
        })

    })

    describe('quote -> base', async () => {

        let tokenFrom

        before(() => {
            tokenFrom = quoteToken
        })

        it('Return zero for non-supported tokens', async () => {
            // Options
            const tokenTo = tkns.YAK
            const amountIn = parseUnits('1', await tokenFrom.decimals())
            // Querying adapter 
            const amountOutQuery = await Adapter.query(
                amountIn, 
                tokenFrom.address, 
                tokenTo.address
            )
            expect(amountOutQuery).to.equal(0)
        })

        it('Return zero if amount too low', async () => {
            const tokenTo = tkns.WAVAX
            const amountIn = parseUnits('0.000001', await tokenFrom.decimals())
            
            const queryOrg = () => Original.querySellBase(
                tokenTo.address, 
                amountIn
            )
            await expect(queryOrg()).to.revertedWith('WooGuardian: inputAmount_LTM')
            const queryAdapter = await Adapter.query(
                amountIn, 
                tokenFrom.address, 
                tokenTo.address
            )
            expect(queryAdapter).to.equal(0)
        })

        it('Query matches swapping - normal', async () => {
            const tokenTo = tkns.WAVAX
            const amountIn = parseUnits('1532', await tokenFrom.decimals())
            await queryMatchesSwapping(tokenFrom, tokenTo, amountIn)
        })

        it('Query matches swapping - low', async () => {
            const tokenTo = tkns.WOO
            const amountIn = parseUnits('0.01', await tokenFrom.decimals())
            await queryMatchesSwapping(tokenFrom, tokenTo, amountIn)
        })

        it('Query matches swapping - high', async () => {
            const tokenTo = tkns.WAVAX
            const amountIn = parseUnits('100000', await tokenFrom.decimals())
            await queryMatchesSwapping(tokenFrom, tokenTo, amountIn)
        })

    })

    describe('base -> base', async () => {

        it('Return zero for non-supported tokens - 1', async () => {
            // Options
            const tokenFrom = tkns.WAVAX
            const tokenTo = tkns.YAK
            const amountIn = parseUnits('1', await tokenFrom.decimals())
            // Querying adapter 
            const amountOutQuery = await Adapter.query(
                amountIn, 
                tokenFrom.address, 
                tokenTo.address
            )
            expect(amountOutQuery).to.equal(0)
        })

        it('Return zero for non-supported tokens - 2', async () => {
            // Options
            const tokenFrom = tkns.YAK
            const tokenTo = tkns.WAVAX
            const amountIn = parseUnits('1', await tokenFrom.decimals())
            // Querying adapter 
            const amountOutQuery = await Adapter.query(
                amountIn, 
                tokenFrom.address, 
                tokenTo.address
            )
            expect(amountOutQuery).to.equal(0)
        })

        it('Return zero if amount too low', async () => {
            const tokenFrom = tkns.WAVAX
            const tokenTo = tkns.WOO
            const amountIn = parseUnits('0.00001', await tokenFrom.decimals())
            
            const queryOrg = () => Original.querySellBase(
                tokenTo.address, 
                amountIn
            )
            await expect(queryOrg()).to.revertedWith('WooGuardian: inputAmount_LTM')
            const queryAdapter = await Adapter.query(
                amountIn, 
                tokenFrom.address, 
                tokenTo.address
            )
            expect(queryAdapter).to.equal(0)
        })

        it('Return zero if amount too high', async () => {
            const tokenFrom = tkns.WOO
            const tokenTo = tkns.WAVAX
            const amountIn = parseUnits('400000000', await tokenFrom.decimals())
            
            const queryOrg = () => Original.querySellBase(
                tokenTo.address, 
                amountIn
            )
            await expect(queryOrg()).to.revertedWith('WooGuardian: inputAmount_GTM')
            const queryAdapter = await Adapter.query(
                amountIn, 
                tokenFrom.address, 
                tokenTo.address
            )
            expect(queryAdapter).to.equal(0)
        })

        // Passes individually, but not with other tests
        it.skip('Query matches swapping - normal', async () => {
            const tokenFrom = tkns.WOO
            const tokenTo = tkns.WAVAX
            const amountIn = parseUnits('8223', await tokenFrom.decimals())
            await queryMatchesSwapping(tokenFrom, tokenTo, amountIn)
        })

        // Passes individually, but not with other tests
        it.skip('Query matches swapping - low', async () => {
            const tokenFrom = tkns.WOO
            const tokenTo = tkns.WAVAX
            const amountIn = parseUnits('0.02', await tokenFrom.decimals())
            await queryMatchesSwapping(tokenFrom, tokenTo, amountIn)
        })

        // Fails because of the case below
        it.skip('Query matches swapping - high', async () => {
            const tokenFrom = tkns.WAVAX
            const tokenTo = tkns.WOO
            const amountIn = parseUnits('2000', await tokenFrom.decimals())
            await queryMatchesSwapping(tokenFrom, tokenTo, amountIn)
        })

        // In certain cases the Woo query returns smaller value than the actual swap
        xit('router mistery', async () => {
            const WooRouter = await ethers.getContractAt('IWooRouter', '0x160020B09DeD3d862f7f851B5c50632BcF2062FF')
            const tokenFrom1 = tkns.USDTe
            const tokenTo1 = tkns.WAVAX
            const amountIn1 = parseUnits('10000', await tokenFrom1.decimals())
            const queryRes1 = await WooRouter.querySwap(tokenFrom1.address, tokenTo1.address, amountIn1)
            await setERC20Bal(tokenFrom1.address, trader.address, amountIn1)
            await approveERC20(trader, tokenFrom1.address, WooRouter.address, amountIn1) 
            const swap1 = () => WooRouter.swap(tokenFrom1.address, tokenTo1.address, amountIn1, queryRes1, trader.address, trader.address)
            await expect(swap1).to.changeTokenBalance(tokenTo1, trader, queryRes1)

            const tokenFrom2 = tkns.WAVAX
            const tokenTo2 = tkns.WOO
            const amountIn2 = parseUnits('200', await tokenFrom2.decimals())
            const queryRes2 = await WooRouter.querySwap(tokenFrom2.address, tokenTo2.address, amountIn2)
            await setERC20Bal(tokenFrom2.address, trader.address, amountIn2)
            await approveERC20(trader, tokenFrom2.address, WooRouter.address, amountIn2) 
            const swap2 = () => WooRouter.swap(tokenFrom2.address, tokenTo2.address, amountIn2, queryRes2, trader.address, trader.address)
            await expect(swap2).to.changeTokenBalance(tokenTo2, trader, queryRes2)
        })

    })

    // Run seperately
    xit('Check gas cost', async () => {
        // Options
        const options = [
            [ tkns.WOO, tkns.WAVAX ],
            [ tkns.USDTe, tkns.WOO ],
            [ tkns.WAVAX, tkns.USDTe ],
        ]
        let maxGas = 0
        for (let [ tokenFrom, tokenTo ] of options) {
            const amountIn = parseUnits('1000', await tokenFrom.decimals())
            // Mint tokens to adapter address
            await setERC20Bal(tokenFrom.address, Adapter.address, amountIn)
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
        }
        // Check that gas estimate is above max, but below 10% of max
        const estimatedGas = await Adapter.swapGasEstimate().then(parseInt)
        expect(estimatedGas).to.be.within(maxGas, maxGas * 1.1)
    })


})
