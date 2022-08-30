const { expect } = require("chai")
const { ethers } = require("hardhat")
const { parseUnits } = ethers.utils

const { setERC20Bal, getTokenContract } = require('../../helpers')
const { assets } = require('../../addresses.json')
const fix = require('../../fixtures')

describe("YakAdapter - wAVAX", function() {

    let genNewAccount
    let WAvaxAdapter
    let YakRouter
    let trader
    let tkns

    before(async () => {
        const fixSimple = await fix.simple()
        tkns = fixSimple.tokenContracts
        genNewAccount = fixSimple.genNewAccount
        // Deploy the adapter
        const gasCost = 1.8e5
        WAvaxAdapter = await ethers.getContractFactory('WAvaxAdapter').then(f => f.deploy(gasCost))
        // Deploy the router
        const BytesManipulationV0 = await ethers.getContractFactory('BytesManipulation').then(f => f.deploy())
        YakRouter = await ethers.getContractFactory(
            'YakRouter', 
            { libraries: { 'BytesManipulation': BytesManipulationV0.address } }
        ).then(f => f.deploy([ WAvaxAdapter.address ], [], ethers.constants.AddressZero, assets.WAVAX))
    })

    beforeEach(async () => {
        trader = genNewAccount()
    })

    describe('quote', async () => {

        it('Return amount-in for any amount in if swap is wAVAX-AVAX or AVAX-wAVAX', async () => {
            // Options
            const tknFrom = assets.WAVAX
            const tknTo = assets.WAVAX
            const amountIn = parseUnits('10000')
            const steps = 3
            // Query adapter 
            const amountOutAdapter = await YakRouter.findBestPathWithGas(
                amountIn, 
                tknFrom, 
                tknTo,
                steps,
                parseUnits('225', 'gwei')
            )
            // Check
            expect(amountOutAdapter.amounts[amountOutAdapter.amounts.length-1]).to.eq(amountIn)
        })


        it('Return zero for non-zero amount in if swap isn`t wAVAX-AVAX or AVAX-wAVAX', async () => {
            // Options
            const tknFrom = assets.WAVAX
            const tknTo = assets.DAIe
            const amountIn = parseUnits('10000')
            const steps = 3
            // Query adapter 
            const amountOutAdapter = await YakRouter.findBestPathWithGas(
                amountIn, 
                tknFrom, 
                tknTo,
                steps,
                parseUnits('225', 'gwei')
            )
            // Expect no path is found
            expect(amountOutAdapter.path.length).to.eq(0)
        })

    })

    describe('swap', async () => {
    
        it('Swapping is 1:1 when AVAX-WAVAX', async () => {
            const amountIn = parseUnits('10000')
            const tknFrom = tkns.WAVAX
            const tknTo = tkns.WAVAX
            const steps = 2
            // Query 
            const queryRes = await YakRouter.findBestPathWithGas(
                amountIn, 
                tknFrom.address, 
                tknTo.address,
                steps,
                parseUnits('225', 'gwei')
            )
            // Swapping
            const swap = () => YakRouter.swapNoSplitFromAVAX(
                [
                    amountIn, 
                    amountIn, 
                    queryRes.path,
                    queryRes.adapters
                ], 
                trader.address, 
                0, 
                { value: amountIn }
            )
            // Check that swap matches the query
            await expect(swap).to.changeTokenBalance(tknTo, trader, amountIn)
        })

        it('Swapping is 1:1 when WAVAX-AVAX', async () => {
            const amountIn = parseUnits('10000')
            const tknFrom = tkns.WAVAX
            const tknTo = tkns.WAVAX
            const steps = 2
            // Mint tokens to trader address and approve them to the router
            await setERC20Bal(tknFrom.address, trader.address, amountIn)
            await tknFrom.connect(trader).approve(YakRouter.address, amountIn)
            console.log(await tknFrom.balanceOf(trader.address).then(bn => bn.toString()))
            // Query 
            const queryRes = await YakRouter.findBestPathWithGas(
                amountIn, 
                tknFrom.address, 
                tknTo.address,
                steps,
                parseUnits('225', 'gwei')
            )
            // Swapping
            const swap = () => YakRouter.connect(trader).swapNoSplitToAVAX(
                [
                    amountIn, 
                    amountIn, 
                    queryRes.path,
                    queryRes.adapters
                ], 
                trader.address, 
                0
            )
            // Check that swap matches the query
            await expect(swap).to.changeEtherBalance(trader, amountIn)
        })

        it('Check gas cost', async () => {
            // Options
            const amountIn = parseUnits('10000')
            const tknFrom = tkns.WAVAX
            const tknTo = tkns.WAVAX
            const steps = 2
            // Query 
            const queryRes = await YakRouter.findBestPathWithGas(
                amountIn, 
                tknFrom.address, 
                tknTo.address,
                steps,
                parseUnits('225', 'gwei')
            )
            const queryTx = await YakRouter.populateTransaction.findBestPathWithGas(
                amountIn, 
                tknFrom.address, 
                tknTo.address,
                steps,
                parseUnits('225', 'gwei')
            )
            const queryGas = await ethers.provider.estimateGas(queryTx).then(parseInt)
            // Swapping
            const swapAVAX2WAVAXReceipt = await YakRouter.connect(trader).swapNoSplitFromAVAX(
                [
                    amountIn, 
                    amountIn, 
                    queryRes.path,
                    queryRes.adapters
                ], 
                trader.address, 
                0, 
                { value: amountIn }
            ).then(r => r.wait())
            await tknFrom.connect(trader).approve(YakRouter.address, amountIn)
            const swapWAVAX2AVAXReceipt = await YakRouter.connect(trader).swapNoSplitToAVAX(
                [
                    amountIn, 
                    amountIn, 
                    queryRes.path,
                    queryRes.adapters
                ], 
                trader.address, 
                0
            ).then(r => r.wait())
            const swapGas = Math.max(
                parseInt(swapAVAX2WAVAXReceipt.gasUsed),
                parseInt(swapWAVAX2AVAXReceipt.gasUsed)
            )
            const gasCost = swapGas + queryGas
            // Check that gas estimate is above max, but below 10% of max
            const estimatedGas = await WAvaxAdapter.swapGasEstimate().then(parseInt)
            expect(estimatedGas).to.be.within(gasCost, gasCost * 1.1)
        })

    })

})
