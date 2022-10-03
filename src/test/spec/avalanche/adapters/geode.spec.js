const { expect } = require('chai')

const { 
    setTestEnv, 
    addresses, 
    constants,
    helpers,
} = require('../../../utils/test-env')
const { assets, other } = addresses.avalanche
const { parseUnits, formatUnits } = ethers.utils
const { yyPlanet } = constants.geode

describe('YakAdapter - geode', () => {
    
    let testEnv
    let tkns
    let ate // adapter-test-env
    let gAVAX
    let Portal

    before(async () => {
        const networkName = 'avalanche'
        const forkBlockNumber = 19595355
        testEnv = await setTestEnv(networkName, forkBlockNumber)
        tkns = testEnv.supportedTkns

        const contractName = 'GeodeWPAdapter'
        const adapterArgs = [
            'GWPyyAvaxAdapter',
            other.GeodePortal,
            constants.geode.yyPlanet,
            346_000,
        ]
        ate = await testEnv.setAdapterEnv(contractName, adapterArgs)
        gAVAX = await ethers.getContractAt('IgAVAX', assets.gAVAX),
        GeodeWP = await ethers.getContractAt('IGeodeWP', other.GWPyyAvax),
        Portal = await ethers.getContractAt('IGeodePortal', other.GeodePortal)
        Adapter = ate.Adapter

    })

    beforeEach(async () => {
        testEnv.updateTrader()
    })

    // @dev: Leave no side effects on Adapter instance
    describe('maintanance', async () => {

        let Adapter

        before(() => {
            Adapter = ate.Adapter.connect(ate.deployer)
        })

        it('set valid interface', async () => {
            const validInterface = await Adapter.pooledTknInterface()
            await expect(Adapter.setInterfaceForPooledTkn(validInterface))
                .to.not.reverted
        })

        it('cant set invalid interface', async () => {
            await expect(Adapter.setInterfaceForPooledTkn(ate.deployer.address))
                .to.revertedWith('Not valid interface')
        })

        it('revoke/set token allowance', async () => {
            // First expect allowance as it is set in the constructor
            const approved = await gAVAX.isApprovedForAll(
                Adapter.address, 
                GeodeWP.address
            )
            if (!approved) {
                await Adapter.setGAvaxAllowance()      
            }

            // Revoke allowance and check allowance is revoked
            await Adapter['revokeGAvaxAllowance()']()
            expect(await gAVAX.isApprovedForAll(
                Adapter.address, 
                GeodeWP.address
            )).to.be.false

            // Set allowance and check allowance is set
            await Adapter.setGAvaxAllowance()
            expect(await gAVAX.isApprovedForAll(
                Adapter.address, 
                GeodeWP.address
            )).to.be.true
        })

    })

    describe('Swapping matches query', async () => {

        // Note: this method wont't produce debt in certain conditions
        async function createDebt() {
            const trader = testEnv.nextAccount()
            // Sell for half of the pooled avax
            const pooledAvax = await ethers.provider.getBalance(
                GeodeWP.address
            )
            const avaxIn = pooledAvax.div(2)
            // Mint yyavax
            const deadline = Math.floor(Date.now()/1e3) + 300
            await Portal.connect(trader).stake(
                ethers.BigNumber.from(yyPlanet), 
                avaxIn.div(2),
                deadline, 
                { value: avaxIn }
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

            const finalDebt = await GeodeWP.getDebt()
            return finalDebt
        }

        async function removeDebt() {
            const minDebt = parseUnits('1', 15)
            const trader = testEnv.nextAccount()
            const debt = await GeodeWP.getDebt()
            if (debt.gt(minDebt)) {
                const deadline = Math.floor(Date.now()/1e3) + 300
                await Portal.connect(trader).stake(
                    ethers.BigNumber.from(yyPlanet), 
                    0,
                    deadline, 
                    { value: debt }
                )
                expect(await GeodeWP.getDebt()).to.lte(minDebt)
            }
        }

        describe('staking is paused && debt < amountIn', async () => {
            // When staking is paused swapping is the only option even
            // if latter offers worse price

            async function pausePool() {
                const maitainterAddress = await Portal.getMaintainerFromId(yyPlanet)
                await helpers.impersonateAccount(maitainterAddress)
                const maintainer = await ethers.getSigner(maitainterAddress)
                await Portal.connect(maintainer).pauseStakingForPool(yyPlanet)
            }

            before(async () => {
                await removeDebt()
                await pausePool()
            })

            it('Swapping matches query :: 0.3456789 WAVAX -> yyAVAX', async () => {
                const amountIn = '0.3456789'
                const tknIn = tkns.WAVAX
                const tknOut = tkns.yyAVAX
                await ate.checkSwapMatchesQuery(amountIn, tknIn, tknOut)
            })

        })

        describe('staking is not paused', async () => {

            async function unpausePool() {
                const maitainterAddress = await Portal.getMaintainerFromId(yyPlanet)
                await helpers.impersonateAccount(maitainterAddress)
                const maintainer = await ethers.getSigner(maitainterAddress)
                await Portal.connect(maintainer).unpauseStakingForPool(yyPlanet)
            }

            let tknIn
            let tknOut

            before(async () => {
                await unpausePool()
            })

            describe('wavax -> yyavax', async () => {

                before(() => {
                    tknIn = tkns.WAVAX
                    tknOut = tkns.yyAVAX
                })

                describe('debt < amountIn', async () => {

                    before(async () => {
                        await removeDebt()
                    })

                    async function checkAdapterQueryGtThanOriginal(
                        tokenFrom, 
                        tokenTo, 
                        amountIn
                    ) {
                        const [ ti0, ti1 ] = tokenFrom.address == assets.WAVAX
                            ? [ 0, 1 ]
                            : [ 1, 0 ]
                        // Query original contract
                        const amountOutOriginal = await GeodeWP.calculateSwap(
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

                    it('query should offer better price than original', async () => {
                        const amountIn = parseUnits('2')
                        await checkAdapterQueryGtThanOriginal(
                            tknIn, 
                            tknOut, 
                            amountIn
                        )
                    })

                    it('swap should match query', async () => {
                        const amountIn = '1.7772'
                        await ate.checkSwapMatchesQuery(
                            amountIn,
                            tknIn,
                            tknOut, 
                        )
                    })

                })

                describe('debt >= amountIn', async () => {

                    let debt

                    before(async () => {
                        debt = await createDebt()
                        expect(debt).gt(0)
                    })

                    beforeEach(async () => {
                        debt = await GeodeWP.getDebt()
                    })

                    it('1% debt', async () => {
                        const amountIn = formatUnits(debt.mul(1).div(100), 18)
                        await ate.checkSwapMatchesQuery(amountIn, tknIn, tknOut)
                    })

                    it('100% debt', async () => {
                        const amountIn = formatUnits(debt, 18)
                        await ate.checkSwapMatchesQuery(amountIn, tknIn, tknOut)
                    })

                })
            })

            describe('yyavax->wavax', async () => {

                before(() => {
                    tknIn = tkns.yyAVAX
                    tknOut = tkns.WAVAX
                })

                it('swap should match the query', async () => {
                    const trader = testEnv.nextAccount()
                    const amountIn = parseUnits('2')
                    // Send yyAVAX to the adapter (cant be minted with `setERC20Bal`)
                    // Note: test assumes that yyAVAX/WAVAX ratio is lte 2
                    await helpers.setERC20Bal(tknOut.address, Adapter.address, amountIn.mul(2))
                    await Adapter.connect(trader).swap(
                        amountIn.mul(2), 
                        0,
                        tknOut.address,
                        tknIn.address, 
                        Adapter.address
                    )
                    // Check 
                    await ate.checkSwapMatchesQuery(
                        formatUnits(amountIn, 18),
                        tknIn,
                        tknOut, 
                    )
                })

            })


        })

    })

    it('Query returns zero if tokens not found', async () => {
        const supportedTkn = tkns.WAVAX
        ate.checkQueryReturnsZeroForUnsupportedTkns(supportedTkn)
    })

    it('Gas-estimate is between max-gas-used and 110% max-gas-used', async () => {
        const options = [
            [ '1', tkns.WAVAX, tkns.yyAVAX ],
        ]
        await ate.checkGasEstimateIsSensible(options)
    })

})