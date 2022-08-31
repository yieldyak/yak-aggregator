const { expect } = require("chai")
const { ethers } = require("hardhat")
const { parseUnits } = ethers.utils

const { fixtures: fix, helpers, addresses } = require('../../../fixtures')
const { setERC20Bal, getTokenContract } = helpers
const { assets } = addresses.avalanche

describe("YakAdapter - Kyber", function() {

    let Adapter
    let Original
    let genNewAccount
    let trader
    let tkns

    before(async () => {
        const fixSimple = await fix.simple()
        const fixCurve = await fix.kyberAdapter()
        tkns = fixSimple.tokenContracts
        genNewAccount = fixSimple.genNewAccount
        Adapter = fixCurve.KyberAdapter
        Original = fixCurve.KyberRouter
    })

    beforeEach(async () => {
        trader = genNewAccount()
    })

    it('Adapter supports USDCe-USDTe, MIM-USDCe, MIM-USDTe, DYP-WAVAX, WETHe-WAVAX, WAVAX-XAVA', async () => {
        const supportedTknPairs = [
            [assets.USDCe, assets.USDTe], 
            [assets.MIM, assets.USDCe], 
            [assets.MIM, assets.USDTe], 
            [assets.DYP, assets.WAVAX], 
            [assets.WETHe, assets.WAVAX], 
            [assets.XAVA, assets.WAVAX]
        ]
        for (let [tkn0, tkn1] of supportedTknPairs) {
            expect(await Adapter.getPool(tkn0, tkn1)).to.not.equal(ethers.constants.AddressZero)
        }
    })

    it('Adapter returns zero for unsupported pairs', async () => {
        const unsupportedTknPairs = [
            [assets.USDCe, assets.WAVAX], 
            [assets.MIM, assets.WAVAX], 
            [assets.DYP, assets.USDTe], 
            [assets.WETHe, assets.USDTe], 
            [assets.XAVA, assets.USDTe]
        ]

        for (let [tkn0, tkn1] of unsupportedTknPairs) {
            expect(await Adapter.query('0xfffff', tkn0, tkn1)).to.equal(ethers.constants.Zero)
        }
    })

    it('Querying adapter matches the price from original contract', async () => {
        // Options
        const tknFrom = assets.XAVA
        const tknTo = assets.WAVAX
        const pool = await Adapter.getPool(tknFrom, tknTo)
        const tknFromDecimals = await getTokenContract(tknFrom).then(t => t.decimals())
        const amountIn = parseUnits('50', tknFromDecimals)
        // Query original contract
        const [ ,amountOutOriginal ] = await Original.getAmountsOut(amountIn, [pool], [tknFrom, tknTo])
        // Query adapter 
        const amountOutAdapter = await Adapter.query(amountIn, tknFrom, tknTo)
        
        // Compare two prices
        expect(amountOutOriginal).to.equal(amountOutAdapter)
    })

    it('Swapping matches query', async () => {
        // Options
        const tokenFrom = tkns.WAVAX
        const tokenTo = tkns.XAVA
        const amountIn = parseUnits('500', await tokenFrom.decimals())
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
    })

    it('Check gas cost', async () => {
        // Options
        const options = [
            [tkns.USDCe, tkns.USDTe], 
            [tkns.MIM, tkns.USDCe], 
            [tkns.MIM, tkns.USDTe], 
            [tkns.DYP, tkns.WAVAX], 
            [tkns.WETHe, tkns.WAVAX], 
            [tkns.XAVA, tkns.WAVAX]
        ]
        let maxGas = 0
        for (let [ tokenFrom, tokenTo ] of options) {
            const amountIn = parseUnits('999999', await tokenFrom.decimals())
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
        }
        // Check that gas estimate is above max, but below 10% of max
        const estimatedGas = await Adapter.swapGasEstimate().then(parseInt)
        expect(estimatedGas).to.be.within(maxGas, maxGas * 1.1)
    })

})
