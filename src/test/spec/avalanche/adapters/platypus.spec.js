const { expect } = require("chai")
const { ethers } = require("hardhat")
const { parseUnits } = ethers.utils

const { fixtures: fix, helpers, addresses } = require('../../../fixtures')
const { assets, platypus } = addresses
const { setERC20Bal } = helpers

describe("YakAdapter - Platypus", function() {

    let Adapter
    let genNewAccount
    let owner
    let tkns

    before(async () => {
        const fixSimple = await fix.simple()
        genNewAccount = fixSimple.genNewAccount
        tkns = fixSimple.tokenContracts
        fixPlatypus = await fix.platypusAdapter()
        Adapter = fixPlatypus.PlatypusAdapter
        owner = fixPlatypus.deployer
    })

    describe('maintanance', async () => {

        beforeEach(() => {
            Adapter = Adapter.connect(owner)
        })

        afterEach(async () => {
            // Clear after each tests
            await Adapter.rmPools([
                platypus.main,
                platypus.frax, 
                platypus.mim, 
                platypus.ust,
            ])
        })

        it('Adapter supports adding pools', async () => {
            const addPoolsPromise = Adapter.addPools([
                platypus.mim, 
                platypus.ust
            ])
            // Add pool support and check events were emitted
            await expect(addPoolsPromise)
                .to.emit(Adapter, 'AddPoolSupport')
                .withArgs(platypus.mim)
                .to.emit(Adapter, 'AddPoolSupport')
                .withArgs(platypus.ust)
            // Check adapter maps tkns to correct pools
            expect(await Adapter.getPoolForTkns(assets.USDC, assets.MIM))
                .to.be.equal(platypus.mim)
            expect(await Adapter.getPoolForTkns(assets.MIM, assets.USDC))
                .to.be.equal(platypus.mim)
        })

        it('Adapter adding pool for specific tkns', async () => {
            const addPoolsPromise = Adapter.setPoolForTkns(
                platypus.main,
                [ assets.DAIe, assets.USDt, assets.USDC ]
            )
            // Add pool support and check events were emitted
            await expect(addPoolsPromise)
                .to.emit(Adapter, 'PartialPoolSupport')
                .withArgs(
                    platypus.main, 
                    [ assets.DAIe, assets.USDt, assets.USDC ]
                )
            // Check adapter maps tkns to correct pools
            expect(await Adapter.getPoolForTkns(assets.USDt, assets.DAIe))
                .to.be.equal(platypus.main)
            expect(await Adapter.getPoolForTkns(assets.DAIe, assets.USDt))
                .to.be.equal(platypus.main)
            expect(await Adapter.getPoolForTkns(assets.DAIe, assets.USDC))
                .to.be.equal(platypus.main)
            expect(await Adapter.getPoolForTkns(assets.USDC, assets.USDt))
                .to.be.equal(platypus.main)
        })

        it('Adapter supports removing pools', async () => {
            // First add pools 
            await Adapter.addPools([platypus.frax])
            expect(await Adapter.getPoolForTkns(assets.USDC, assets.FRAXc))
                .to.be.equal(platypus.frax)
            expect(await Adapter.getPoolForTkns(assets.FRAXc, assets.USDC))
                .to.be.equal(platypus.frax)
            // Then remove them
            const rmPoolsPromise = Adapter.rmPools([platypus.frax])
            await expect(rmPoolsPromise)
                .to.emit(Adapter, 'RmPoolSupport')
                .withArgs(platypus.frax)
            expect(await Adapter.getPoolForTkns(assets.USDC, assets.FRAXc))
                .to.be.equal(ethers.constants.AddressZero)
            expect(await Adapter.getPoolForTkns(assets.FRAXc, assets.USDC))
                .to.be.equal(ethers.constants.AddressZero)
        })

        it('Cant rm pools for specific tkns', async () => {
            const rmPoolPromise = Adapter.setPoolForTkns(
                ethers.constants.AddressZero,
                [ assets.DAIe, assets.USDt ]
            )
            await expect(rmPoolPromise).to.revertedWith('Only non-zero pool')
        })

        it('Cannot add unsupported token', async () => {
            const addPoolPromise = Adapter.setPoolForTkns(
                platypus.main,
                [assets.DAIe, assets.MIM]
            )
            await expect(addPoolPromise)
                .to.revertedWith('Pool does not support tkns')
        })

        it('Tkn repeats not supported', async () => {
            const addPoolPromise = Adapter.setPoolForTkns(
                platypus.main,
                [assets.DAIe, assets.DAIe]
            )
            await expect(addPoolPromise)
                .to.revertedWith('Pool does not support tkns')
        })

    })


    describe('swap & query', async () => {

        let Original
        let trader

        async function checkAdapterSwapMatchesQuery(
            tokenFrom, 
            tokenTo, 
            amountIn
        ) {
            amountIn = amountIn || parseUnits(
                '1332.2', 
                await tokenFrom.decimals()
            )
            // Querying adapter 
            const amountOutQuery = await Adapter.query(
                amountIn, 
                tokenFrom.address, 
                tokenTo.address
            )
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
            // Check that swap matches the query
            await expect(swap).to.changeTokenBalance(
                tokenTo, 
                trader, 
                amountOutQuery
            )
            // Check leftovers arent left in the adapter
            expect(await tokenTo.balanceOf(Adapter.address)).to.equal(0)
        }

        async function checkAdapterQueryMatchesOriginal(
            tokenFrom, 
            tokenTo, 
            amountIn
        ) {
            amountIn = amountIn || parseUnits(
                '1332.2', 
                await tokenFrom.decimals()
            )
            // Query original contract
            const amountOutOriginal = await Original.quotePotentialSwap(
                tokenFrom.address, 
                tokenTo.address,
                amountIn
            )
            // Query adapter 
            const amountOutAdapter = await Adapter.query(
                amountIn, 
                tokenFrom.address, 
                tokenTo.address
            )
            // Compare two prices
            expect(amountOutOriginal).to.equal(amountOutAdapter)
        }

        beforeEach(async () => {
            trader = genNewAccount()
            Adapter = Adapter.connect(trader)
        })

        it('Query returns zero if pool doesnt exist', async () => {
            const amountOut = await Adapter.query(
                parseUnits('100'), 
                assets.DAIe,
                assets.USDC
            )
            expect(amountOut).to.eq(0)
        })

        describe('main', async () => {

            before(async () => {
                Original = await ethers.getContractAt(
                    'IPlatypus',
                    platypus.main
                )
                await Adapter.connect(owner).addPools([platypus.main])
            })
    
            it('Querying adapter matches the price from original contract', async () => {
                const tknFrom = tkns.DAIe
                const tknTo = tkns.USDt
                const amountIn = parseUnits('10000', await tknFrom.decimals())
                await checkAdapterSwapMatchesQuery(tknFrom, tknTo, amountIn)  
            })
        
            it('Swapping matches query', async () => {
                const tokenFrom = tkns.USDTe
                const tokenTo = tkns.USDCe
                const amountIn = parseUnits('3333', await tokenFrom.decimals())
                await checkAdapterQueryMatchesOriginal(tokenFrom, tokenTo, amountIn)
            })
            
        })

        describe('mim', async () => {

            before(async () => {
                Original = await ethers.getContractAt(
                    'IPlatypus',
                    platypus.mim
                )
                await Adapter.connect(owner).addPools([platypus.mim])
            })
            
            beforeEach(async () => {
                trader = genNewAccount()
                Adapter = Adapter.connect(trader)
            })
    
            it('Querying adapter matches the price from original contract', async () => {
                const tknFrom = tkns.MIM
                const tknTo = tkns.USDC
                const amountIn = parseUnits('1', await tknFrom.decimals())
                await checkAdapterSwapMatchesQuery(tknFrom, tknTo, amountIn)  
            })
        
            it('Swapping matches query', async () => {
                const tokenFrom = tkns.USDC
                const tokenTo = tkns.MIM
                const amountIn = parseUnits('3333', await tokenFrom.decimals())
                await checkAdapterQueryMatchesOriginal(tokenFrom, tokenTo, amountIn)
            })
            
        })

        describe('frax', async () => {

            before(async () => {
                Original = await ethers.getContractAt(
                    'IPlatypus',
                    platypus.frax
                )
                await Adapter.connect(owner).addPools([platypus.frax])
            })
            
            beforeEach(async () => {
                trader = genNewAccount()
                Adapter = Adapter.connect(trader)
            })
    
            it('Querying adapter matches the price from original contract', async () => {
                const tknFrom = tkns.FRAXc
                const tknTo = tkns.USDC
                const amountIn = parseUnits('1', await tknFrom.decimals())
                await checkAdapterSwapMatchesQuery(tknFrom, tknTo, amountIn)  
            })
        
            it('Swapping matches query', async () => {
                const tokenFrom = tkns.USDC
                const tokenTo = tkns.FRAXc
                const amountIn = parseUnits('3333', await tokenFrom.decimals())
                await checkAdapterQueryMatchesOriginal(tokenFrom, tokenTo, amountIn)
            })
            
        })

        it('Check gas cost', async () => {
            const trader = genNewAccount()
            await Adapter.connect(owner).addPools([
                platypus.main, 
                platypus.frax,
                platypus.mim,
                platypus.ust,
            ])
            // Options
            const options = [
                [ tkns.USDC, tkns.FRAXc ],
                [ tkns.USDC, tkns.DAIe ],
                [ tkns.USDC, tkns.MIM ],
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
