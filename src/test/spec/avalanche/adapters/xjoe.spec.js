const { expect } = require("chai")
const { ethers } = require("hardhat")
const { parseUnits } = ethers.utils

const { fixtures: fix, helpers, addresses } = require('../../../fixtures')
const { setERC20Bal, getTokenContract } = helpers
const { assets } = addresses

describe("YakAdapter - xJOE", function() {

    let Adapter
    let Original
    let genNewAccount
    let trader
    let tkns

    before(async () => {
        const fixSimple = await fix.simple()
        const fixCurve = await fix.xjoeAdapter()
        tkns = fixSimple.tokenContracts
        genNewAccount = fixSimple.genNewAccount
        Adapter = fixCurve.XJoeAdapter
        Original = fixCurve.XJoe
    })

    beforeEach(async () => {
        trader = genNewAccount()
    })

    describe('quote', async () => {

        it('Return non-zero for non-zero amount in if swap is xJOE-JOE or xJOE-JOE', async () => {
            // Options
            const tknFrom = assets.xJOE
            const tknTo = assets.JOE
            const tknFromDecimals = await getTokenContract(tknFrom).then(t => t.decimals())
            const amountIn = parseUnits('10000', tknFromDecimals)
            // Query adapter 
            const amountOutAdapter = await Adapter.query(amountIn, tknFrom, tknTo)
            // Check
            expect(amountOutAdapter).to.gt(0)
        })


        it('Return zero for non-zero amount in if swap isn`t xJOE-JOE or xJOE-JOE', async () => {
            // Options
            const tknFrom = assets.USDTe
            const tknTo = assets.JOE
            const tknFromDecimals = await getTokenContract(tknFrom).then(t => t.decimals())
            const amountIn = parseUnits('10000', tknFromDecimals)
            // Query adapter 
            const amountOutAdapter = await Adapter.query(amountIn, tknFrom, tknTo)
            // Check
            expect(amountOutAdapter).to.eq(0)
        })

    })

    describe('swap', async () => {
    
        it('Swapping matches query - enter', async () => {
            // Options
            const tokenFrom = tkns.JOE
            const tokenTo = tkns.xJOE
            const amountIn = parseUnits('133311', await tokenFrom.decimals())
            // Querying adapter 
            const amountOutQuery = await Adapter.query(
                amountIn, 
                tokenFrom.address, 
                tokenTo.address
            )
            // Expect amount out is greater than 0
            expect(amountOutQuery).to.gt(0)
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

        it('Swapping matches query - leave', async () => {
            // Options
            const tokenFrom = tkns.xJOE
            const tokenTo = tkns.JOE
            const amountIn = parseUnits('133311', await tokenFrom.decimals())
            // Querying adapter 
            const amountOutQuery = await Adapter.query(
                amountIn, 
                tokenFrom.address, 
                tokenTo.address
            )
            // Expect amount out is greater than 0
            expect(amountOutQuery).to.gt(0)
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

        it('Adaper swap matches original swap - enter', async () => {
            // Options
            const tokenFrom = tkns.JOE
            const tokenTo = tkns.xJOE
            const amountIn = parseUnits('133311', await tokenFrom.decimals())
            // Querying adapter 
            const amountOutQuery = await Adapter.query(
                amountIn, 
                tokenFrom.address, 
                tokenTo.address
            )
            // Expect amount out is greater than 0
            expect(amountOutQuery).to.gt(0)
            // Mint tokens to adapter address
            await setERC20Bal(tokenFrom.address, Adapter.address, amountIn)
            expect(await tokenFrom.balanceOf(Adapter.address)).to.equal(amountIn)
            // Mint tokens to trader address
            await setERC20Bal(tokenFrom.address, trader.address, amountIn)
            expect(await tokenFrom.balanceOf(trader.address)).to.equal(amountIn)         
            // Approve tokens from trader to original
            await tokenFrom.connect(trader).approve(Original.address, amountIn)
            expect(await tokenFrom.allowance(trader.address, Original.address)).to.equal(amountIn)  
            // Swapping
            const swapAdapter = () => Adapter.connect(trader).swap(
                amountIn, 
                amountOutQuery,
                tokenFrom.address,
                tokenTo.address, 
                trader.address
            )
            const swapOriginal = () => Original.connect(trader).enter(amountIn)
            // Check that swap matches the query
            await expect(swapAdapter).to.changeTokenBalance(tokenTo, trader, amountOutQuery)
            await expect(swapOriginal).to.changeTokenBalance(tokenTo, trader, amountOutQuery)
        })

        it('Adaper swap matches original swap - leave', async () => {
            // Options
            const tokenFrom = tkns.xJOE
            const tokenTo = tkns.JOE
            const amountIn = parseUnits('133311', await tokenFrom.decimals())
            // Querying adapter 
            const amountOutQuery = await Adapter.query(
                amountIn, 
                tokenFrom.address, 
                tokenTo.address
            )
            // Expect amount out is greater than 0
            expect(amountOutQuery).to.gt(0)
            // Mint tokens to adapter address
            await setERC20Bal(tokenFrom.address, Adapter.address, amountIn)
            expect(await tokenFrom.balanceOf(Adapter.address)).to.equal(amountIn)
            // Mint tokens to trader address
            await setERC20Bal(tokenFrom.address, trader.address, amountIn)
            expect(await tokenFrom.balanceOf(trader.address)).to.equal(amountIn)         
            // Approve tokens from trader to original
            await tokenFrom.connect(trader).approve(Original.address, amountIn)
            expect(await tokenFrom.allowance(trader.address, Original.address)).to.equal(amountIn)  
            // Swapping
            const swapAdapter = () => Adapter.connect(trader).swap(
                amountIn, 
                amountOutQuery,
                tokenFrom.address,
                tokenTo.address, 
                trader.address
            )
            const swapOriginal = () => Original.connect(trader).leave(amountIn)
            // Check that swap matches the query
            await expect(swapAdapter).to.changeTokenBalance(tokenTo, trader, amountOutQuery)
            await expect(swapOriginal).to.changeTokenBalance(tokenTo, trader, amountOutQuery)
        })

        it('Check gas cost', async () => {
            // Options
            const options = [
                [ tkns.JOE, tkns.xJOE ],
                [ tkns.xJOE, tkns.JOE ]
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
                const queryGas = await ethers.provider.estimateGas(queryTx).then(parseInt)
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
