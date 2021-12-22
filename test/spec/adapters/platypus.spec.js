const { expect } = require("chai")
const { ethers } = require("hardhat")
const { parseUnits } = ethers.utils

const { setERC20Bal, getTokenContract } = require('../../helpers')
const { assets } = require('../../addresses.json')
const fix = require('../../fixtures')

describe("YakAdapter - Platypus", function() {

    let fixCurve
    let genNewAccount
    let trader
    let tkns

    before(async () => {
        const fixSimple = await fix.simple()
        fixCurve = await fix.platypusAdapter()
        tkns = fixSimple.tokenContracts
        genNewAccount = fixSimple.genNewAccount
    })

    beforeEach(async () => {
        trader = genNewAccount()
    })

    describe('V1', async () => {

        let Adapter
        let Original

        before(async () => {
            Adapter = fixCurve.PlatypusAdapter
            Original = fixCurve.PlatypusV1
        })

        it('Adapter supports USDCe, USDTe, USDCe, MIM', async () => {
            const supportedTokens = [
                assets.USDCe, 
                assets.USDTe, 
                assets.DAIe, 
                assets.MIM
            ]
            for (let tkn of supportedTokens) {
                expect(await Adapter.isPoolToken(tkn)).to.be.true
            }
        })

        it('Querying adapter matches the price from original contract', async () => {
            // Options
            const tknFrom = assets.DAIe
            const tknTo = assets.MIM
            const tknFromDecimals = await getTokenContract(tknFrom).then(t => t.decimals())
            const amountIn = parseUnits('10000', tknFromDecimals)
            // Query original contract
            const amountOutOriginal = await Original.quotePotentialSwap(tknFrom, tknTo, amountIn)
            // Query adapter 
            const amountOutAdapter = await Adapter.query(amountIn, tknFrom, tknTo)
            // Compare two prices
            expect(amountOutOriginal).to.equal(amountOutAdapter)
        })
    
        it('Swapping matches query', async () => {
            // Options
            const tokenFrom = tkns.USDTe
            const tokenTo = tkns.USDCe
            const amountIn = parseUnits('133311', await tokenFrom.decimals())
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
                [ tkns.USDCe, tkns.USDTe ],
                [ tkns.MIM, tkns.DAIe ],
                [ tkns.DAIe, tkns.USDCe ],
                [ tkns.USDTe, tkns.MIM ],
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

})
