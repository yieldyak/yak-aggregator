const { expect } = require("chai")
const { ethers } = require("hardhat")
const { parseUnits } = ethers.utils

const { setERC20Bal } = require('../../helpers')
const { assets } = require('../../addresses.json')
const fix = require('../../fixtures')

describe("YakAdapter - Gmx", function() {

    let genNewAccount
    let trader
    let tkns

    before(async () => {
        const fixSimple = await fix.simple()
        fixGmx = await fix.gmxAdapter()
        tkns = fixSimple.tokenContracts
        genNewAccount = fixSimple.genNewAccount
    })

    beforeEach(async () => {
        trader = genNewAccount()
    })

    describe('GMX', async () => {

        let Adapter
        let Original

        before(async () => {
            Adapter = fixGmx.GmxAdapterV0
            Original = fixGmx.GmxVault
        })

        it('Adapter supports USDCe, MIM, WBTCe, USDC, WAVAX, WETHe ', async () => {
            const supportedTokens = [
                assets.USDCe, 
                assets.USDC, 
                assets.MIM,
                assets.WAVAX, 
                assets.WBTCe, 
                assets.WETHe, 
            ]
            for (let tkn of supportedTokens) {
                expect(await Adapter.isPoolToken(tkn)).to.be.true
            }
        })
    
        xit('Swapping matches query #1', async () => {
            // Options
            const tokenFrom = tkns.MIM
            const tokenTo = tkns.WBTCe
            const amountIn = parseUnits('4')
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

        it('Swapping matches query #2', async () => {
            // Options
            const tokenFrom = tkns.USDCe
            const tokenTo = tkns.WETHe
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
            // Check leftovers arent left in the adapter
            expect(await tokenTo.balanceOf(Adapter.address)).to.equal(0)
        })

        it('Swapping matches query #3', async () => {
            // Options
            const tokenFrom = tkns.USDC
            const tokenTo = tkns.WAVAX
            const amountIn = parseUnits('33311', await tokenFrom.decimals())
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

        it('Swap 120% of token balance', async () => {
            // Options
            const tokenFrom = tkns.USDC
            const tokenTo = tkns.WAVAX
            const vaultBal = await tokenFrom.balanceOf(Original.address)
            const amountIn = vaultBal.mul('12').div('10')
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

        it('Swapping invalid token raises an error', async () => {
            // Options
            const tokenFrom = tkns.FRAX
            const tokenTo = tkns.USDC
            const amountIn = parseUnits('33', await tokenFrom.decimals())
            // Mint tokens to adapter address
            await setERC20Bal(tokenFrom.address, Adapter.address, amountIn)
            expect(await tokenFrom.balanceOf(Adapter.address)).to.equal(amountIn)    
            // Swapping
            const swap = () => Adapter.connect(trader).swap(
                amountIn, 
                amountIn,
                tokenFrom.address,
                tokenTo.address, 
                trader.address
            )
            // Check that swap matches the query
            await expect(swap()).to.revertedWith('Vault: _tokenIn not whitelisted')
        })

        it('Except query to return zero for token not whitelisted', async () => {
            // Options
            const tokenFrom = tkns.FRAX
            const tokenTo = tkns.WAVAX
            const amountIn = parseUnits('33311', await tokenFrom.decimals())
            // Querying adapter 
            const amountOutQuery = await Adapter.query(
                amountIn, 
                tokenFrom.address, 
                tokenTo.address
            )
            expect(amountOutQuery).to.equal(0)
        })

        it('Expect the query to return zero if swap amount is greater than vault bal', async () => {
            // Options
            const tokenFrom = tkns.WAVAX
            const tokenTo = tkns.WBTCe
            const amountIn = parseUnits('33311', await tokenFrom.decimals())
            // Trade more tokens that are in the pool
            await setERC20Bal(tokenTo.address, Original.address, parseUnits('4'))
            // Querying adapter
            const amountOutQuery = await Adapter.query(
                amountIn, 
                tokenFrom.address, 
                tokenTo.address
            )
            await expect(amountOutQuery).to.equal(0)
        })

        it('Check gas cost', async () => {
            // Options
            const options = [
                [ tkns.USDCe, tkns.WAVAX ],
                [ tkns.MIM, tkns.WBTCe ],
                [ tkns.WETHe, tkns.USDCe ],
            ]
            let maxGas = 0
            for (let [ tokenFrom, tokenTo ] of options) {
                const amountIn = parseUnits('9', await tokenFrom.decimals())
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
