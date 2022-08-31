const { expect } = require("chai")
const { ethers } = require("hardhat")
const { parseUnits } = ethers.utils

const { fixtures: fix, helpers, addresses } = require('../../../fixtures')
const { setERC20Bal, getTokenContract } = helpers
const { assets } = addresses

describe("YakAdapter - Synapse", function() {

    let fixCurve
    let genNewAccount
    let trader
    let tkns

    before(async () => {
        const fixSimple = await fix.simple()
        fixCurve = await fix.synapseAdapter()
        tkns = fixSimple.tokenContracts
        genNewAccount = fixSimple.genNewAccount
    })

    beforeEach(async () => {
        trader = genNewAccount()
    })

    describe('Synapse', async () => {

        let Adapter
        let Original

        before(async () => {
            Adapter = fixCurve.SynapseAdapter
            Original = fixCurve.SynapsePool
        })

        it('Adapter supports nUSD, USDTe, DAIe, USDCe', async () => {
            const supportedTokens = [
                assets.USDTe, 
                assets.USDCe, 
                assets.DAIe, 
                assets.NUSD
            ]
            for (let tkn of supportedTokens) {
                expect(await Adapter.isPoolToken(tkn)).to.be.true
            }
        })

        it('Querying adapter matches the price from original contract', async () => {
            // Options
            const tknFrom = assets.NUSD
            const tknTo = assets.USDTe
            const [ tknFromIndex, tknToIndex ] = await Promise.all([
                Adapter.tokenIndex(tknFrom),
                Adapter.tokenIndex(tknTo)
            ])
            
            const tknFromDecimals = await getTokenContract(tknFrom).then(t => t.decimals())
            const amountIn = parseUnits('10000', tknFromDecimals)
            // Query original contract
            const amountOutOriginal = await Original.calculateSwap(tknFromIndex, tknToIndex, amountIn)
            // Query adapter 
            const amountOutAdapter = await Adapter.query(amountIn, tknFrom, tknTo)
            // Compare two prices
            expect(amountOutOriginal).to.equal(amountOutAdapter)
        })
    
        it('Swapping matches query', async () => {
            // Options
            const tokenFrom = tkns.USDCe
            const tokenTo = tkns.NUSD
            const amountIn = parseUnits('133311', await tokenFrom.decimals())
            // Querying adapter 
            const amountOutQuery = await Adapter.query(
                amountIn, 
                tokenFrom.address, 
                tokenTo.address
            )
            expect(amountOutQuery).to.be.above(0)
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
                [ tkns.NUSD, tkns.DAIe ],
                [ tkns.DAIe, tkns.USDCe ],
                [ tkns.USDTe, tkns.NUSD ],
            ]
            let maxGas = 0
            for (let [ tokenFrom, tokenTo ] of options) {
                const amountIn = parseUnits('1', await tokenFrom.decimals())
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
