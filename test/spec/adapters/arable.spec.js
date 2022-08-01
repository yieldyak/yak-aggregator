const { expect } = require("chai")
const { ethers } = require("hardhat")
const { parseUnits, formatUnits } = ethers.utils

const { setERC20Bal, impersonateAccount, injectFunds } = require('../../helpers')
const { assets } = require('../../addresses.json')
const fix = require('../../fixtures')

describe("YakAdapter - ArableSF", function() {

    let genNewAccount
    let trader
    let tkns

    before(async () => {
        const fixSimple = await fix.simple()
        fixArable = await fix.arableAdapter()
        tkns = fixSimple.tokenContracts
        genNewAccount = fixSimple.genNewAccount
    })

    beforeEach(async () => {
        trader = genNewAccount()
    })

    describe('ArableSF', async () => {

        let Adapter
        let Original

        before(async () => {
            Adapter = fixArable.ArableAdapterV0
            Original = fixArable.ArableSF
        })

        it('Original supports USDCe, USDC, USDt, USDT.e, FRAX, YUSD, arUSD', async () => {
            const supportedTokens = [
                assets.USDCe, 
                assets.USDC, 
                assets.USDt, 
                assets.USDTe,
                assets.FRAXc, 
                assets.YUSD, 
                assets.arUSD, 
            ]
            for (let tkn of supportedTokens) {
                expect(await Original.isStableToken(tkn)).to.be.true
            }
        })

        it('Swapping matches query #1', async () => {
            // Options
            const tokenFrom = tkns.USDCe
            const tokenTo = tkns.USDC
            const amountIn = parseUnits('100', await tokenFrom.decimals())
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
            const tokenFrom = tkns.USDC
            const tokenTo = tkns.YUSD
            const amountIn = parseUnits('100', await tokenFrom.decimals())
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

        it('Swap more tokens than the pool holds', async () => {
            // Options
            const tokenFrom = tkns.USDC
            const tokenTo = tkns.USDCe
            const vaultBal = await tokenTo.balanceOf(Original.address)
            // Swap 120% of token balance
            const amountIn = vaultBal.mul('12').div('10')
            // Querying adapter 
            const amountOutQuery = await Adapter.query(
                amountIn, 
                tokenFrom.address, 
                tokenTo.address
            )
            // Expect query to return zero amount out
            expect(amountOutQuery).to.equal(0)

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
            await expect(swap()).to.revertedWith('ERC20: transfer amount exceeds balance')
        })

        it('Swapping invalid token raises an error', async () => {
            // Options
            const tokenFrom = tkns.DAI
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
            await expect(swap()).to.revertedWith('Invalid tokens')
        })

        it('Except query to return zero for token not whitelisted', async () => {
            // Options
            const tokenFrom = tkns.USDC
            const tokenTo = tkns.DAI
            const amountIn = parseUnits('100', await tokenFrom.decimals())
            // Querying adapter 
            const amountOutQuery = await Adapter.query(
                amountIn, 
                tokenFrom.address, 
                tokenTo.address
            )
            expect(amountOutQuery).to.equal(0)
        })

        it('Check gas cost', async () => {
            // Options
            const options = [
                [ tkns.USDCe, tkns.USDt ],
                [ tkns.FRAXc, tkns.YUSD ],
                [ tkns.USDTe, tkns.USDC ],
            ]
            let maxGas = 0
            for (let [ tokenFrom, tokenTo ] of options) {
                const amountIn = parseUnits('0.02', await tokenFrom.decimals())
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
