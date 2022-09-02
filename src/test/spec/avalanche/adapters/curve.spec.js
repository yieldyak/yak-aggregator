const { expect } = require("chai")
const { ethers } = require("hardhat")
const { parseUnits } = ethers.utils

const { fixtures: fix, helpers, addresses } = require('../../../fixtures')
const { setERC20Bal, getTokenContract } = helpers
const { assets } = addresses.avalanche

describe("YakAdapter - Curve", function() {

    let fixCurve
    let genNewAccount
    let trader
    let tkns

    before(async () => {
        const fixSimple = await fix.simple()
        fixCurve = await fix.curveAdapter()
        tkns = fixSimple.tokenContracts
        genNewAccount = fixSimple.genNewAccount
    })

    beforeEach(async () => {
        trader = genNewAccount()
    })

    describe('aave', async () => {

        let Adapter
        let Original

        before(async () => {
            Adapter = fixCurve.CurveAaveAdapter
            Original = fixCurve.CurveAave
        })

        it('Adapter supports USDC, USDT, DAI', async () => {
            const supportedTokens = [
                assets.USDCe, 
                assets.USDTe,
                assets.DAIe 
            ]
            for (let tkn of supportedTokens) {
                expect(await Adapter.isPoolToken(tkn)).to.be.true
            }
        })

        it('Querying adapter matches the price from original contract', async () => {
            // Options
            const tknIndexFrom = 0
            const tknIndexTo = 1
            const [ tknFrom, tknTo ] = await Promise.all([
                Original.underlying_coins(tknIndexFrom),
                Original.underlying_coins(tknIndexTo)
            ])
            const tknFromDecimals = await getTokenContract(tknFrom).then(t => t.decimals())
            const amountIn = parseUnits('1', tknFromDecimals)
            // Query original contract
            const amountOutOriginal = await Original['get_dy_underlying(int128,int128,uint256)'](tknIndexFrom, tknIndexTo, amountIn)
            // Query adapter 
            const amountOutAdapter = await Adapter.query(amountIn, tknFrom, tknTo)
            // Compare two prices (there should be 1 wei difference to account for error in rounding)
            expect(amountOutOriginal).to.equal(amountOutAdapter.add(parseUnits('1', 'wei')))
        })
    
        it('Swapping matches query', async () => {
            // Options
            const tokenFrom = tkns.DAIe
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
                [ tkns.USDCe, tkns.DAIe ],
                [ tkns.USDTe, tkns.DAIe ],
                [ tkns.DAIe, tkns.USDCe ],
                [ tkns.DAIe, tkns.USDTe ],
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

    describe('atricrypto', async () => {

        let Adapter
        let Original

        before(async () => {
            Adapter = fixCurve.CurveAtricryptoAdapter
            Original = fixCurve.CurveAtricrypto
        })

        it('Adapter supports WBTC, WETH, USDC, USDT, DAI', async () => {
            const supportedTokens = [
                assets.WBTCe, 
                assets.WETHe,
                assets.USDCe, 
                assets.USDTe,
                assets.DAIe 
            ]
            for (let tkn of supportedTokens) {
                expect(await Adapter.isPoolToken(tkn)).to.be.true
            }
        })

        it('Querying adapter matches the price from original contract within 4bps', async () => {
            // Options
            const tknIndexFrom = 0
            const tknIndexTo = 1
            const [ tknFrom, tknTo ] = await Promise.all([
                Original.underlying_coins(tknIndexFrom),
                Original.underlying_coins(tknIndexTo)
            ])
            const tknFromDecimals = await getTokenContract(tknFrom).then(t => t.decimals())
            const amountIn = parseUnits('1', tknFromDecimals)
            // Query original contract
            const amountOutOriginal = await Original['get_dy_underlying(uint256,uint256,uint256)'](tknIndexFrom, tknIndexTo, amountIn)
            // Query adapter 
            const amountOutAdapter = await Adapter.query(amountIn, tknFrom, tknTo)
            // Compare two prices (there should be 4 bps difference to account for the query inaccuracies)
            const amountWithFee = amountOutOriginal.mul(1e4-4).div(1e4)
            expect(amountWithFee).to.equal(amountOutAdapter)
        })

        it('Swapping matches query', async () => {
            // Options
            const tokenFrom = tkns.USDCe
            const tokenTo = tkns.WBTCe
            const amountIn = parseUnits('5983', await tokenFrom.decimals())
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
            const traderBal0 = await tokenTo.balanceOf(trader.address)
            await swap()
            const traderBal1 = await tokenTo.balanceOf(trader.address)
            expect(traderBal1.sub(traderBal0)).to.gte(amountOutQuery)
        })

        it('Check gas cost', async () => {
            // Options
            const options = [
                [ tkns.USDCe, tkns.DAIe ],
                [ tkns.USDTe, tkns.DAIe ],
                [ tkns.DAIe, tkns.USDCe ],
                [ tkns.DAIe, tkns.USDTe ],
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

    describe('ren', async () => {

        let Adapter
        let Original

        before(async () => {
            Adapter = fixCurve.CurveRenAdapter
            Original = fixCurve.CurveRen
        })

        it('Adapter supports renBTC, WBTCe', async () => {
            const supportedTokens = [
                assets.renBTC, 
                assets.WBTCe
            ]
            for (let tkn of supportedTokens) {
                expect(await Adapter.isPoolToken(tkn)).to.be.true
            }
        })

        it('Querying adapter matches the price from original contract', async () => {
            // Options
            const tknIndexFrom = 0
            const tknIndexTo = 1
            const [ tknFrom, tknTo ] = await Promise.all([
                Original.underlying_coins(tknIndexFrom),
                Original.underlying_coins(tknIndexTo)
            ])
            const tknFromDecimals = await getTokenContract(tknFrom).then(t => t.decimals())
            const amountIn = parseUnits('1', tknFromDecimals)
            // Query original contract
            const amountOutOriginal = await Original['get_dy_underlying(int128,int128,uint256)'](tknIndexFrom, tknIndexTo, amountIn)
            // Query adapter 
            const amountOutAdapter = await Adapter.query(amountIn, tknFrom, tknTo)
            // Compare two prices (there should be 1 wei difference to account for error in rounding)
            expect(amountOutOriginal).to.equal(amountOutAdapter.add(parseUnits('1', 'wei')))
        })
    
        it('Swapping matches query', async () => {
            // Options
            const tokenFrom = tkns.WBTCe
            const tokenTo = tkns.renBTC
            const amountIn = parseUnits('12', await tokenFrom.decimals())
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
                [ tkns.renBTC, tkns.WBTCe ],
                [ tkns.WBTCe, tkns.renBTC ],
            ]
            let maxGas = 0
            for (let [ tokenFrom, tokenTo ] of options) {
                const amountIn = parseUnits('100', await tokenFrom.decimals())
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

    describe('3poolV2', async () => {

        let Adapter
        let Original

        before(async () => {
            Adapter = fixCurve.Curve3poolV2Adapter
            Original = fixCurve.Curve3poolV2
        })

        it('Adapter supports MIM, USDTe, USDCe', async () => {
            const supportedTokens = [
                assets.MIM, 
                assets.USDTe,
                assets.USDCe
            ]
            for (let tkn of supportedTokens) {
                expect(await Adapter.isPoolToken(tkn)).to.be.true
            }
        })

        it('Querying adapter matches the price from original contract', async () => {
            // Options
            const tknIndexFrom = 0
            const tknIndexTo = 1
            const [ tknFrom, tknTo ] = await Promise.all([
                Original.coins(tknIndexFrom),
                Original.coins(tknIndexTo)
            ])
            const tknFromDecimals = await getTokenContract(tknFrom).then(t => t.decimals())
            const amountIn = parseUnits('100', tknFromDecimals)
            // Query original contract
            const amountOutOriginal = await Original['get_dy(int128,int128,uint256)'](tknIndexFrom, tknIndexTo, amountIn)
            // Query adapter 
            const amountOutAdapter = await Adapter.query(amountIn, tknFrom, tknTo)
            // Compare two prices (there should be 1 wei difference to account for error in rounding)
            expect(amountOutOriginal).to.equal(amountOutAdapter.add(parseUnits('1', 'wei')))
        })
    
        it('Swapping matches query', async () => {
            // Options
            const tokenFrom = tkns.MIM
            const tokenTo = tkns.USDCe
            const amountIn = parseUnits('12000', await tokenFrom.decimals())
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
                [ tkns.USDCe, tkns.MIM ],
                [ tkns.USDTe, tkns.MIM ],
                [ tkns.MIM, tkns.USDCe ],
            ]
            let maxGas = 0
            for (let [ tokenFrom, tokenTo ] of options) {
                const amountIn = parseUnits('10000', await tokenFrom.decimals())
                // Mint tokens to adapter address
                await setERC20Bal(tokenFrom.address, Adapter.address, amountIn)
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

    describe('mim', async () => {

        let Adapter
        let Original

        before(async () => {
            Adapter = fixCurve.CurveMimAdapter
            Original = fixCurve.CurveMim
        })

        it('Adapter supports MIM, USDTe, USDCe, DAIe', async () => {
            const supportedTokens = [
                assets.MIM, 
                assets.USDTe,
                assets.USDCe, 
                assets.DAIe
            ]
            for (let tkn of supportedTokens) {
                expect(await Adapter.isPoolToken(tkn)).to.be.true
            }
        })

        it('Querying adapter matches the price from original contract', async () => {
            // Options
            const tknFrom = assets.MIM
            const tknTo = assets.DAIe
            const tknIndexFrom = await Adapter.tokenIndex(tknFrom)
            const tknIndexTo = await Adapter.tokenIndex(tknTo)
            const tknFromDecimals = await getTokenContract(tknFrom).then(t => t.decimals())
            const amountIn = parseUnits('100', tknFromDecimals)
            // Query original contract
            const amountOutOriginal = await Original['get_dy_underlying(int128,int128,uint256)'](tknIndexFrom, tknIndexTo, amountIn)
            // Query adapter 
            const amountOutAdapter = await Adapter.query(amountIn, tknFrom, tknTo)
            // Compare two prices (there should be 4 bps difference to account for the query inaccuracies)
            const amountWithFee = amountOutOriginal.mul(1e4-4).div(1e4)
            expect(amountWithFee).to.equal(amountOutAdapter)
        })
    
        it('Swapping matches query', async () => {
            // Options
            const tokenFrom = tkns.USDCe
            const tokenTo = tkns.MIM
            const amountIn = parseUnits('100000', await tokenFrom.decimals())
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
                [ tkns.DAIe, tkns.MIM ],
                [ tkns.USDCe, tkns.MIM ],
                [ tkns.USDTe, tkns.MIM ],
                [ tkns.MIM, tkns.DAIe ],
            ]
            let maxGas = 0
            for (let [ tokenFrom, tokenTo ] of options) {
                const amountIn = parseUnits('10000', await tokenFrom.decimals())
                // Mint tokens to adapter address
                await setERC20Bal(tokenFrom.address, Adapter.address, amountIn)
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

    describe('usdc', async () => {

        let Adapter
        let Original

        before(async () => {
            Adapter = fixCurve.CurveUSDCAdapter
            Original = fixCurve.CurveUSDC
        })

        it('Adapter supports USDC, USDCe', async () => {
            const supportedTokens = [
                assets.USDCe,
                assets.USDC
            ]
            for (let tkn of supportedTokens) {
                expect(await Adapter.isPoolToken(tkn)).to.be.true
            }
        })

        it('Querying adapter matches the price from original contract', async () => {
            // Options
            const tknIndexFrom = 0
            const tknIndexTo = 1
            const [ tknFrom, tknTo ] = await Promise.all([
                Original.coins(tknIndexFrom),
                Original.coins(tknIndexTo)
            ])
            const tknFromDecimals = await getTokenContract(tknFrom).then(t => t.decimals())
            const amountIn = parseUnits('100', tknFromDecimals)
            // Query original contract
            const amountOutOriginal = await Original['get_dy(int128,int128,uint256)'](tknIndexFrom, tknIndexTo, amountIn)
            // Query adapter 
            const amountOutAdapter = await Adapter.query(amountIn, tknFrom, tknTo)
            // Compare two prices (there should be 1 wei difference to account for error in rounding)
            expect(amountOutOriginal).to.equal(amountOutAdapter.add(parseUnits('1', 'wei')))
        })
    
        it('Swapping matches query', async () => {
            // Options
            const tokenFrom = tkns.USDC
            const tokenTo = tkns.USDCe
            const amountIn = parseUnits('12000', await tokenFrom.decimals())
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
                [ tkns.USDC, tkns.USDCe ],
            ]
            let maxGas = 0
            for (let [ tokenFrom, tokenTo ] of options) {
                const amountIn = parseUnits('10000', await tokenFrom.decimals())
                // Mint tokens to adapter address
                await setERC20Bal(tokenFrom.address, Adapter.address, amountIn)
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

    describe('deUSDC', async () => {

        let Adapter
        let Original

        before(async () => {
            Adapter = fixCurve.CurveDeUSDCAdapter
            Original = fixCurve.CurveDeUSDCPool
        })

        it('Adapter supports underlying deUSDC, USDCe, USDTe, DAIe', async () => {
            const supportedTokens = [
                assets.deUSDC,
                assets.USDCe,
                assets.USDTe,
                assets.DAIe,
            ]
            for (let tkn of supportedTokens) {
                expect(await Adapter.isUnderlyingToken(tkn)).to.be.true
            }
        })
    
        it('Swapping matches query', async () => {

            async function checkAdapterSwapMatchesQuery(tokenFrom, tokenTo) {
                const amountIn = parseUnits('1200', await tokenFrom.decimals())
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
                await expect(swap()).to.not.reverted
                expect(await tokenTo.balanceOf(trader.address)).to.gte(amountOutQuery)
                // Check leftovers arent left in the adapter
                expect(await tokenTo.balanceOf(Adapter.address)).to.equal(0)
            }

            await checkAdapterSwapMatchesQuery(tkns.USDCe, tkns.deUSDC)
            await checkAdapterSwapMatchesQuery(tkns.deUSDC, tkns.USDTe)
            await checkAdapterSwapMatchesQuery(tkns.DAIe, tkns.deUSDC)    
        })

        it('At least one pair needs to include $MONEY', async () => {

            async function getAmountOut(tokenFrom, tokenTo) {
                const amountIn = parseUnits('12000', await tokenFrom.decimals())
                // Querying adapter 
                return Adapter.query(
                    amountIn, 
                    tokenFrom.address, 
                    tokenTo.address
                )
            }

            expect(await getAmountOut(tkns.DAIe, tkns.USDCe)).to.be.equal(0)
            expect(await getAmountOut(tkns.USDTe, tkns.DAIe)).to.be.equal(0)
            expect(await getAmountOut(tkns.USDCe, tkns.USDTe)).to.be.equal(0)

        })

        it('Check gas cost', async () => {
            // Options
            const options = [
                [ tkns.deUSDC, tkns.USDCe ],
                [ tkns.DAIe, tkns.deUSDC ],
                [ tkns.deUSDC, tkns.USDTe ],
            ]
            let maxGas = 0
            for (let [ tokenFrom, tokenTo ] of options) {
                const amountIn = parseUnits('10000', await tokenFrom.decimals())
                // Mint tokens to adapter address
                await setERC20Bal(tokenFrom.address, Adapter.address, amountIn)
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

    describe('more', async () => {

        let Adapter
        let Original

        before(async () => {
            Adapter = fixCurve.CurveMoreAdapter
            Original = fixCurve.CurveMorePool
        })

        it('Adapter supports underlying DAIe, USDCe, USDTe', async () => {
            const supportedTokens = [
                assets.USDCe,
                assets.USDTe,
                assets.DAIe,
            ]
            for (let tkn of supportedTokens) {
                expect(await Adapter.isUnderlyingToken(tkn)).to.be.true
            }
        })
    
        it('Swapping matches query', async () => {

            async function checkAdapterSwapMatchesQuery(tokenFrom, tokenTo) {
                const amountIn = parseUnits('1200', await tokenFrom.decimals())
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
                await expect(swap()).to.not.reverted
                expect(await tokenTo.balanceOf(trader.address)).to.gte(amountOutQuery)
                // Check leftovers arent left in the adapter
                expect(await tokenTo.balanceOf(Adapter.address)).to.equal(0)
            }

            await checkAdapterSwapMatchesQuery(tkns.MONEY, tkns.USDTe)
            await checkAdapterSwapMatchesQuery(tkns.DAIe, tkns.MONEY)
            await checkAdapterSwapMatchesQuery(tkns.MONEY, tkns.USDCe)    
        })

        it('At least one pair needs to include $MONEY', async () => {

            async function getAmountOut(tokenFrom, tokenTo) {
                const amountIn = parseUnits('12000', await tokenFrom.decimals())
                // Querying adapter 
                return Adapter.query(
                    amountIn, 
                    tokenFrom.address, 
                    tokenTo.address
                )
            }

            expect(await getAmountOut(tkns.DAIe, tkns.USDCe)).to.be.equal(0)
            expect(await getAmountOut(tkns.USDTe, tkns.DAIe)).to.be.equal(0)
            expect(await getAmountOut(tkns.USDCe, tkns.USDTe)).to.be.equal(0)

        })

        it('Check gas cost', async () => {
            // Options
            const options = [
                [ tkns.MONEY, tkns.USDCe ],
                [ tkns.DAIe, tkns.MONEY ],
                [ tkns.MONEY, tkns.USDTe ],
            ]
            let maxGas = 0
            for (let [ tokenFrom, tokenTo ] of options) {
                const amountIn = parseUnits('10000', await tokenFrom.decimals())
                // Mint tokens to adapter address
                await setERC20Bal(tokenFrom.address, Adapter.address, amountIn)
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

    describe('3poolf', async () => {

        let Adapter
        let Original

        before(async () => {
            Adapter = fixCurve.Curve3poolfAdapter
            Original = fixCurve.Curve3poolf
        })

        it('Adapter supports UST, USDt, USDC', async () => {
            const supportedTokens = [
                assets.USDt,
                assets.USDC, 
                assets.UST
            ]
            for (let tkn of supportedTokens) {
                expect(await Adapter.isPoolToken(tkn)).to.be.true
            }
        })

        it('Querying adapter matches the price from original contract', async () => {
            // Options
            const tknIndexFrom = 0
            const tknIndexTo = 1
            const [ tknFrom, tknTo ] = await Promise.all([
                Original.coins(tknIndexFrom),
                Original.coins(tknIndexTo)
            ])
            const tknFromDecimals = await getTokenContract(tknFrom).then(t => t.decimals())
            const amountIn = parseUnits('100', tknFromDecimals)
            // Query original contract
            const amountOutOriginal = await Original['get_dy(int128,int128,uint256)'](tknIndexFrom, tknIndexTo, amountIn)
            // Query adapter 
            const amountOutAdapter = await Adapter.query(amountIn, tknFrom, tknTo)
            // Compare two prices (there should be 1 wei difference to account for error in rounding)
            expect(amountOutOriginal).to.equal(amountOutAdapter.add(parseUnits('1', 'wei')))
        })
    
        it('Swapping matches query', async () => {
            // Options
            const tokenFrom = tkns.USDC
            const tokenTo = tkns.USDCe
            const amountIn = parseUnits('12000', await tokenFrom.decimals())
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
                [ tkns.UST, tkns.USDC ],
                [ tkns.USDC, tkns.USDt ],
                [ tkns.USDt, tkns.UST ],
            ]
            let maxGas = 0
            for (let [ tokenFrom, tokenTo ] of options) {
                const amountIn = parseUnits('10000', await tokenFrom.decimals())
                // Mint tokens to adapter address
                await setERC20Bal(tokenFrom.address, Adapter.address, amountIn)
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

    describe('yusd', async () => {

        let Adapter
        let Original

        before(async () => {
            Adapter = fixCurve.CurveYUSDAdapter
            Original = fixCurve.CurveYUSD
        })

        it('Adapter supports YUSD, USDC, USDt', async () => {
            const supportedTokens = [
                assets.USDt,
                assets.USDC,
                assets.YUSD,
            ]
            for (let tkn of supportedTokens) {
                expect(await Adapter.isPoolToken(tkn)).to.be.true
            }
        })

        it('Querying adapter matches the price from original contract', async () => {
            // Options
            const tknIndexFrom = 2
            const tknIndexTo = 0
            const [ tknFrom, tknTo ] = await Promise.all([
                Original.coins(tknIndexFrom),
                Original.coins(tknIndexTo)
            ])
            const tknFromDecimals = await getTokenContract(tknFrom).then(t => t.decimals())
            const amountIn = parseUnits('100', tknFromDecimals)
            // Query original contract
            const amountOutOriginal = await Original['get_dy(int128,int128,uint256)'](tknIndexFrom, tknIndexTo, amountIn)
            // Query adapter 
            const amountOutAdapter = await Adapter.query(amountIn, tknFrom, tknTo)
            // Compare two prices (there should be 1 wei difference to account for error in rounding)
            expect(amountOutOriginal).to.equal(amountOutAdapter.add(parseUnits('1', 'wei')))
        })

        it('Swapping matches query', async () => {

            async function checkAdapterSwapMatchesQuery(tokenFrom, tokenTo) {
                const amountIn = parseUnits('1200', await tokenFrom.decimals())
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
                await expect(swap()).to.not.reverted
                expect(await tokenTo.balanceOf(trader.address)).to.gte(amountOutQuery)
                // Check leftovers arent left in the adapter
                expect(await tokenTo.balanceOf(Adapter.address)).to.equal(1)  // 1 wei is left in the contract
            }

            await checkAdapterSwapMatchesQuery(tkns.YUSD, tkns.USDt)
            await checkAdapterSwapMatchesQuery(tkns.USDt, tkns.USDC)
            await checkAdapterSwapMatchesQuery(tkns.USDC, tkns.YUSD)    
        })

        it('Check gas cost', async () => {
            // Options
            const options = [
                [ tkns.YUSD, tkns.USDt ],
                [ tkns.USDt, tkns.USDC ],
                [ tkns.USDC, tkns.YUSD ],
            ]
            let maxGas = 0
            for (let [ tokenFrom, tokenTo ] of options) {
                const amountIn = parseUnits('10000', await tokenFrom.decimals())
                // Mint tokens to adapter address
                await setERC20Bal(tokenFrom.address, Adapter.address, amountIn)
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
