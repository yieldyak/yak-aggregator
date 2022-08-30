const { expect } = require("chai")
const { ethers } = require("hardhat")
const { parseUnits } = ethers.utils

const { fixtures: fix, helpers, addresses } = require('../../../fixtures')
const { setERC20Bal, getTokenContract } = helpers
const { assets } = addresses

describe("YakAdapter - Axial", function() {

    let fixCurve
    let genNewAccount
    let trader
    let tkns

    before(async () => {
        const fixSimple = await fix.simple()
        fixCurve = await fix.axialAdapter()
        tkns = fixSimple.tokenContracts
        genNewAccount = fixSimple.genNewAccount
    })

    beforeEach(async () => {
        trader = genNewAccount()
    })

    // Pool is no longer active
    describe.skip('AM3DUSDC', async () => {

        let Adapter
        let Original

        before(async () => {
            Adapter = fixCurve.AxialAM3DUSDCAdapter
            Original = fixCurve.AxialAM3DUSDC
        })

        it('Adapter supports USDCe, MIM, DAIe, USDC', async () => {
            const supportedTokens = [
                assets.USDCe, 
                assets.USDC, 
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
            const [ tknFromIndex, tknToIndex ] = await Promise.all([
                Adapter.tokenIndex(tknFrom),
                Adapter.tokenIndex(tknTo)
            ])
            
            const tknFromDecimals = await getTokenContract(tknFrom).then(t => t.decimals())
            const amountIn = parseUnits('10000', tknFromDecimals)
            // Query original contract
            const amountOutOriginal = await Original.calculateSwapUnderlying(tknFromIndex, tknToIndex, amountIn)
            // Query adapter 
            const amountOutAdapter = await Adapter.query(amountIn, tknFrom, tknTo)
            // Compare two prices (original query does not include fee)
            const amountOutOriginalWithFee = amountOutOriginal.mul(9996).div(1e4)
            expect(amountOutOriginalWithFee).to.equal(amountOutAdapter)
        })
    
        it('Swapping matches query', async () => {
            // Options
            const tokenFrom = tkns.DAIe
            const tokenTo = tkns.MIM
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
                [ tkns.USDCe, tkns.USDC ],
                [ tkns.MIM, tkns.DAIe ],
                [ tkns.DAIe, tkns.USDCe ],
                [ tkns.USDC, tkns.MIM ],
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

    describe('AM3D', async () => {

        let Adapter
        let Original

        before(async () => {
            Adapter = fixCurve.AxialAM3DAdapter
            Original = fixCurve.AxialAM3D
        })

        it('Adapter supports USDCe, MIM, DAIe', async () => {
            const supportedTokens = [
                assets.USDCe, 
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
            const tokenTo = tkns.MIM
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
                [ tkns.USDCe, tkns.DAIe ],
                [ tkns.MIM, tkns.DAIe ],
                [ tkns.DAIe, tkns.USDCe ],
                [ tkns.USDCe, tkns.MIM ],
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

    describe('AC4D', async () => {

        let Adapter
        let Original

        before(async () => {
            Adapter = fixCurve.AxialAC4DAdapter
            Original = fixCurve.AxialAC4D
        })

        it('Adapter supports TSD, MIM, DAIe, FRAX(canonical)', async () => {
            const supportedTokens = [
                assets.TSD, 
                assets.FRAXc, 
                assets.MIM,
                assets.DAIe,
            ]
            for (let tkn of supportedTokens) {
                expect(await Adapter.isPoolToken(tkn)).to.be.true
            }
        })

        it('Querying adapter matches the price from original contract', async () => {
            // Options
            const tknFrom = assets.FRAXc
            const tknTo = assets.MIM
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
            const tokenFrom = tkns.DAIe
            const tokenTo = tkns.TSD
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
                [ tkns.FRAXc, tkns.DAIe ],
                [ tkns.MIM, tkns.TSD ],
                [ tkns.DAIe, tkns.TSD ],
                [ tkns.FRAXc, tkns.MIM ],
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

    describe('AA3D', async () => {

        let Adapter
        let Original

        before(async () => {
            Adapter = fixCurve.AxialAA3DAdapter
            Original = fixCurve.AxialAA3D
        })

        it('Adapter supports AVAI, MIM, USDCe', async () => {
            const supportedTokens = [
                assets.AVAI, 
                assets.MIM, 
                assets.USDCe
            ]
            for (let tkn of supportedTokens) {
                expect(await Adapter.isPoolToken(tkn)).to.be.true
            }
        })

        it('Querying adapter matches the price from original contract', async () => {
            // Options
            const tknFrom = assets.AVAI
            const tknTo = assets.MIM
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
            const tokenTo = tkns.AVAI
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
                [ tkns.AVAI, tkns.USDCe ],
                [ tkns.MIM, tkns.AVAI ],
                [ tkns.USDCe, tkns.AVAI ],
                [ tkns.AVAI, tkns.MIM ],
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
