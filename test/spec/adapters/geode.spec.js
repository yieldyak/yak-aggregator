const { ethers } = require("hardhat")
const { expect } = require("chai")
const { parseUnits, formatUnits } = ethers.utils

const { assets, other } = require('../../addresses.json')
const { yyPlanet } = require('../../constants.json').geode
const { setERC20Bal, impersonateAccount } = require('../../helpers')
const fix = require('../../fixtures')

describe("YakAdapter - Geode", function() {

    let Adapter
    let Original
    let genNewAccount
    let fixGeode
    let owner
    let tkns
    let gAVAX
    let Portal

    before(async () => {
        const fixSimple = await fix.simple()
        genNewAccount = fixSimple.genNewAccount
        tkns = fixSimple.tokenContracts
        fixGeode = await fix.geodeWPAdapter()
        owner = fixGeode.deployer
        gAVAX = fixGeode.gAVAX
        Portal = await ethers.getContractAt(
            'IGeodePortal', 
            other.GeodePortal
        )
        
    })

    describe('yyAvax', async () => {

        before(async () => {
            Adapter = fixGeode.GeodeWPAdapter
            Original = fixGeode.GeodeWP
        })

        describe('maintanance', async () => {

            before(() => {
                Adapter = Adapter.connect(owner)
            })

            it('cant set invalid interface', async () => {
                await expect(Adapter.setInterfaceForPooledTkn(owner.address))
                    .to.revertedWith('Not interface for the pooled token')
            })

            it('revoke/set token allowance', async () => {
                // First except allowance as it is set in the constructor
                expect(await gAVAX.isApprovedForAll(
                    Adapter.address, 
                    Original.address
                )).to.be.true

                // Revoke allowance and check allowance is revoked
                await Adapter['revokeAllowance()']()
                expect(await gAVAX.isApprovedForAll(
                    Adapter.address, 
                    Original.address
                )).to.be.false

                // Set allowance and check allowance is set
                await Adapter.setAllowances()
                expect(await gAVAX.isApprovedForAll(
                    Adapter.address, 
                    Original.address
                )).to.be.true
            })

            it('set valid interface', async () => {
                const validInterface = await Adapter.pooledTknInterface()
                await expect(Adapter.setInterfaceForPooledTkn(validInterface))
                    .to.not.reverted
            })

        })

        describe('query & swap', async () => {

            // Note: this method wont't produce debt in ceratain conditions
            async function createDebt() {
                const trader = genNewAccount()
                // Sell for half of the pooled avax
                const pooledAvax = await ethers.provider.getBalance(
                    Original.address
                )
                const avaxIn = pooledAvax.div(2)
                // Mint yyavax
                const deadline = Math.floor(Date.now()/1e3) + 300
                await Portal.connect(trader).stake(
                    ethers.BigNumber.from(yyPlanet), 
                    avaxIn.div(2),
                    deadline, 
                    { value: parseUnits('10') }
                )
                const yyAvaxIn = await tkns.yyAVAX.balanceOf(trader.address)
                await tkns.yyAVAX.connect(trader).transfer(
                    Adapter.address, 
                    yyAvaxIn
                )
                // Sell yyavax 
                await Adapter.swap(
                    yyAvaxIn,
                    0,
                    assets.yyAVAX, 
                    assets.WAVAX, 
                    trader.address
                )

                const finalDebt = await Original.getDebt()
                return finalDebt
            }

            async function removeDebt() {
                const minDebt = parseUnits('1', 15)
                const trader = genNewAccount()
                const debt = await Original.getDebt()
                if (debt.gt(minDebt)) {
                    const deadline = Math.floor(Date.now()/1e3) + 300
                    await Portal.connect(trader).stake(
                        ethers.BigNumber.from(yyPlanet), 
                        0,
                        deadline, 
                        { value: debt }
                    )
                    expect(await Original.getDebt()).to.lte(minDebt)
                }
            }

            async function checkAdapterQueryMatchesOriginal(
                tokenFrom, 
                tokenTo, 
                amountIn
            ) {
                const [ ti0, ti1 ] = tokenFrom.address == assets.WAVAX
                    ? [ 0, 1 ]
                    : [ 1, 0 ]
                // Query original contract
                const amountOutOriginal = await Original.calculateSwap(
                    ti0, 
                    ti1,
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

            async function checkAdapterSwapMatchesQuery(
                tokenFrom, 
                tokenTo, 
                amountIn
            ) {
                // Querying adapter 
                const amountOutQuery = await Adapter.query(
                    amountIn, 
                    tokenFrom.address, 
                    tokenTo.address
                )
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

            let trader

            beforeEach(() => {
                trader = genNewAccount()
            })

            describe('staking is paused && debt < amountIn', async () => {
                // Since staking is paused swapping is the only option even
                // if latter offers worse price

                async function pausePool() {
                    const maitainterAddress = await Portal.getMaintainerFromId(yyPlanet)
                    await impersonateAccount(maitainterAddress)
                    const maintainer = await ethers.getSigner(maitainterAddress)
                    await Portal.connect(maintainer).pauseStakingForPool(yyPlanet)
                }

                before(async () => {
                    await removeDebt()
                    await pausePool()
                })

                it('WAVAX -> yyAVAX query should match original', async () => {
                    const amountIn = parseUnits('11')
                    await checkAdapterQueryMatchesOriginal(
                        tkns.WAVAX, 
                        tkns.yyAVAX, 
                        amountIn
                    )
                })

                it('WAVAX -> yyAVAX swap should match query', async () => {
                    const amountIn = parseUnits('1.3456789')
                    const tknIn = tkns.WAVAX
                    const tknOut = tkns.yyAVAX
                    // Mint tokens to adapter address
                    await setERC20Bal(tknIn.address, Adapter.address, amountIn)
                    // Check 
                    await checkAdapterSwapMatchesQuery(
                        tknIn,
                        tknOut, 
                        amountIn
                    )
                })


            })

            describe('staking is not paused', async () => {

                async function unpausePool() {
                    const maitainterAddress = await Portal.getMaintainerFromId(yyPlanet)
                    await impersonateAccount(maitainterAddress)
                    const maintainer = await ethers.getSigner(maitainterAddress)
                    await Portal.connect(maintainer).unpauseStakingForPool(yyPlanet)
                }

                let tknIn
                let tknOut

                before(async () => {
                    await unpausePool()
                })

                describe('wavax->yyavax', async () => {

                    before(() => {
                        tknIn = tkns.WAVAX
                        tknOut = tkns.yyAVAX
                    })

                    describe('debt < amountIn', async () => {

                        async function checkAdapterQueryGtThanOriginal(
                            tokenFrom, 
                            tokenTo, 
                            amountIn
                        ) {
                            const [ ti0, ti1 ] = tokenFrom.address == assets.WAVAX
                                ? [ 0, 1 ]
                                : [ 1, 0 ]
                            // Query original contract
                            const amountOutOriginal = await Original.calculateSwap(
                                ti0, 
                                ti1,
                                amountIn
                            )
                            // Query adapter 
                            const amountOutAdapter = await Adapter.query(
                                amountIn, 
                                tokenFrom.address, 
                                tokenTo.address
                            )
                            // Compare two prices
                            expect(amountOutAdapter).to.gt(amountOutOriginal)
                        }

                        before(async () => {
                            await removeDebt()
                        })

                        it('query should offer better price than original', async () => {
                            const amountIn = parseUnits('11')
                            await checkAdapterQueryGtThanOriginal(
                                tknIn, 
                                tknOut, 
                                amountIn
                            )
                        })

                        it('swap should match query', async () => {
                            const amountIn = parseUnits('1.7772')
                            // Mint tokens to adapter address
                            await setERC20Bal(tknIn.address, Adapter.address, amountIn)
                            // Check 
                            await checkAdapterSwapMatchesQuery(
                                tknIn,
                                tknOut, 
                                amountIn
                            )
                        })

                    })

                    describe('debt >= amountIn', async () => {

                        let debt

                        before(async () => {
                            debt = await createDebt()
                            expect(debt).gt(0)
                        })

                        describe('query should match the original', async () => {

                            it('1% debt', async () => {
                                const amountIn = debt.mul(1).div(100) // 1% of debt
                                await checkAdapterQueryMatchesOriginal(
                                    tknIn, 
                                    tknOut, 
                                    amountIn
                                )
                            })
    
                            it('100% debt', async () => {
                                const amountIn = debt // 100% of debt
                                await checkAdapterQueryMatchesOriginal(
                                    tknIn, 
                                    tknOut, 
                                    amountIn
                                )
                            })

                        })

                        describe('swap should match query', async () => {

                            beforeEach(async () => {
                                debt = await Original.getDebt()
                            })

                            it('1% debt', async () => {
                                const amountIn = debt.mul(1).div(100) // 1% of debt
                                // Mint tokens to adapter address
                                await setERC20Bal(tknIn.address, Adapter.address, amountIn)
                                // Check 
                                await checkAdapterSwapMatchesQuery(
                                    tknIn,
                                    tknOut, 
                                    amountIn
                                )
                            })
    
                            it('100% debt', async () => {
                                const amountIn = debt.mul(1).div(100) // 100% of debt
                                // Mint tokens to adapter address
                                await setERC20Bal(tknIn.address, Adapter.address, amountIn)
                                // Check 
                                await checkAdapterSwapMatchesQuery(
                                    tknIn,
                                    tknOut, 
                                    amountIn
                                )
                            })

                        })    

                    })

                })

                describe('yyavax->wavax', async () => {

                    before(() => {
                        tknIn = tkns.yyAVAX
                        tknOut = tkns.WAVAX
                    })

                    it('query should match original', async () => {
                        const amountIn = parseUnits('11')
                        await checkAdapterQueryMatchesOriginal(
                            tknIn, 
                            tknOut, 
                            amountIn
                        )
                    })

                    it('swap should match the query', async () => {
                        const amountIn = parseUnits('2')
                        // Send yyAVAX to the adapter (cant be minted with `setERC20Bal`)
                        // Note: test assumes that yyAVAX/WAVAX ratio is lte 2
                        await setERC20Bal(tknOut.address, Adapter.address, amountIn.mul(2))
                        await Adapter.connect(trader).swap(
                            amountIn.mul(2), 
                            0,
                            tknOut.address,
                            tknIn.address, 
                            Adapter.address
                        )
                        // Check 
                        await checkAdapterSwapMatchesQuery(
                            tknIn,
                            tknOut, 
                            amountIn
                        )
                    })

                })


            })

            it('Check gas cost', async () => {
                // Greatest gas cost would be when you are staking and swapping
                // this occurs when debt > MIN_DEBT and amountIn > debt
    
                // Create debt and check debt> MIN_DEBT
                const debt = await createDebt()
                expect(debt).gt(parseUnits('1', 15))
                // Get query and swap costs: wAVAX => yyAVAX 
                const amountIn = debt.mul(110).div(100) // amountIn is 110% of debt
                const tokenIn = tkns.WAVAX
                const tokenOut = tkns.yyAVAX
                const trader = genNewAccount()
                
                await setERC20Bal(tokenIn.address, Adapter.address, amountIn)
                const swapGasCost = await Adapter.connect(trader).estimateGas.swap(
                    amountIn, 
                    0,
                    tokenIn.address,
                    tokenOut.address, 
                    trader.address
                ).then(parseInt)
                const queryGasCost = await Adapter.estimateGas.query(
                    amountIn,
                    tokenIn.address,
                    tokenOut.address
                ).then(parseInt)
                const maxGas = swapGasCost + queryGasCost
                // Check that gas estimate is above 90% of maxGas but also below it
                const estimatedGas = await Adapter.swapGasEstimate().then(parseInt)
                expect(estimatedGas).to.be.within(parseInt(maxGas*0.9), maxGas)
            })

        })


    })

})
