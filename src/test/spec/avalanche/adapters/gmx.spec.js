const { expect } = require("chai")
const { ethers } = require("hardhat")
const { parseUnits } = ethers.utils

const { fixtures: fix, helpers, addresses } = require('../../../fixtures')
const { setERC20Bal, impersonateAccount, injectFunds } = helpers
const { assets } = addresses

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

        it('Swapping matches query #1', async () => {
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
            // Check that swap matches the query and no leftovers in adapter
            await expect(swap).to.changeTokenBalances(
                tokenTo,
                [trader, Adapter],
                [amountOutQuery, parseUnits('0')]
            )
        })

        it('Swapping matches query #2', async () => {
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
            await expect(swap()).to.revertedWith('Vault: max USDG exceeded')
        })

        it('Swap more tokens than reserved', async () => {
            // Options
            const tokenFrom = tkns.USDC
            const tokenTo = tkns.USDCe
            const reserved = await Original.reservedAmounts(tokenTo.address)
            const vaultBal = await tokenTo.balanceOf(Original.address)
            const amountIn = vaultBal.sub(reserved.mul('8').div('10'))
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
            await expect(swap()).to.revertedWith('Vault: reserve exceeds pool')
        })

        it('Swap more tokens than max-usdg allows', async () => {
            // Options
            const tokenFrom = tkns.USDC
            const tokenTo = tkns.USDCe
            const maxUsdg = await Original.maxUsdgAmounts(tokenFrom.address)
            const amountIn = maxUsdg.mul('12').div('10')
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
            await expect(swap()).to.revertedWith('Vault: max USDG exceeded')
        })

        it('Swap more than token buffer allows', async () => {
            // Options
            const tokenFrom = tkns.USDC
            const tokenTo = tkns.USDCe
            // Decrease pool token balance by 60%
            // Code below only makes sense if from and to tokens are 1:1
            const vaultBal = await tokenTo.balanceOf(Original.address)
            const amountIn = vaultBal.mul(5).div(10)
            // Pretend to be gov to modify the `bufferAmounts`
            const gov = await Original.gov()
            await impersonateAccount(gov)
            // Send gov enough money to pay for gas
            await injectFunds(trader, gov, parseUnits('1'))
            const govWallet = ethers.provider.getSigner(gov)
            // Set buffer amount to 50% of the pool balance
            const newBufferAmount = vaultBal.mul(5).div(10)
            await Original.connect(govWallet).setBufferAmount(
                tokenTo.address, 
                newBufferAmount
            )   
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
            await expect(swap()).to.revertedWith('Vault: poolAmount < buffer')
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

        it('Check gas cost', async () => {
            // Options
            const options = [
                [ tkns.USDCe, tkns.WAVAX ],
                [ tkns.WAVAX, tkns.WBTCe ],
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
