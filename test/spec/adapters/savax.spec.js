const { expect } = require("chai")
const { ethers } = require("hardhat")
const { parseUnits } = ethers.utils

const { setERC20Bal } = require('../../helpers')
const fix = require('../../fixtures')

describe("YakAdapter - Curve", function() {

    let Adapter
    let Original
    let genNewAccount
    let trader
    let tkns

    before(async () => {
        const fixSimple = await fix.simple()
        tkns = fixSimple.tokenContracts
        genNewAccount = fixSimple.genNewAccount
        fixSAvax = await fix.savaxAdapter()
        Adapter = fixSAvax.SAvaxAdapter
        Original = fixSAvax.SAVAX
    })

    beforeEach(async () => {
        trader = genNewAccount()
    })

    it('Query only supports wAVAX -> SAVAX', async () => {
        const amountIn = parseUnits('120')
        const invalid = [
            [tkns.SAVAX, tkns.WAVAX],
            [tkns.WAVAX, tkns.DAIe],
            [tkns.SAVAX, tkns.DAIe],
        ]
        await Promise.all(invalid.map(async ([from, to]) => {
            expect(await Adapter.query(
                amountIn,
                from.address, 
                to.address, 
            )).to.eq(0)
        }))
        expect(await Adapter.query(
            amountIn,
            tkns.WAVAX.address, 
            tkns.SAVAX.address, 
        )).to.gte(amountIn)
    })

    it.only('Query returns zero if max-cap is exceeded', async () => {
        const tokenFrom = tkns.WAVAX
        const tokenTo = tkns.SAVAX
        const cap = await Original.totalPooledAvaxCap()
        const pooled = await Original.totalPooledAvax()
        const amountIn = cap.sub(pooled).add(1)
        // Querying adapter 
        const amountOutQuery = await Adapter.query(
            amountIn, 
            tokenFrom.address, 
            tokenTo.address
        )
        expect(amountOutQuery).to.equal(0)
    })

    it('Swapping matches query', async () => {
        const tokenFrom = tkns.WAVAX
        const tokenTo = tkns.SAVAX
        const amountIn = parseUnits('1200', await tokenFrom.decimals())
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
        // Check leftovers arent left in the adapter
        expect(await tokenTo.balanceOf(Adapter.address)).to.equal(0)
    })

    it('Swapping matches original', async () => {
        const tokenFrom = tkns.WAVAX
        const tokenTo = tkns.SAVAX
        const amountIn = parseUnits('1', await tokenFrom.decimals())
        // Mint tokens to adapter address
        await setERC20Bal(tokenFrom.address, Adapter.address, amountIn)
        expect(await tokenFrom.balanceOf(Adapter.address)).to.equal(amountIn)     
        // Swapping
        const swapAdapter = () => Adapter.connect(trader).swap(
            amountIn, 
            0,
            tokenFrom.address,
            tokenTo.address, 
            trader.address
        )
        const swapOriginal = () => Original.connect(trader).submit({value: amountIn})
        await expect(swapAdapter()).to.not.reverted
        const newTknToBal = await tokenTo.balanceOf(trader.address)
        expect(newTknToBal).to.not.eq(0)
        await expect(swapOriginal).to.changeTokenBalance(tokenTo, trader, newTknToBal)
    })

    it('Check gas cost', async () => {
        // Options
        const options = [
            [ tkns.WAVAX, tkns.SAVAX ],
        ]
        let maxGas = 0
        for (let [ tokenFrom, tokenTo ] of options) {
            const amountIn = parseUnits('1', await tokenFrom.decimals())
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
