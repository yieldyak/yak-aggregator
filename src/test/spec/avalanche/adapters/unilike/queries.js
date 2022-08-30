const { expect } = require("chai")
const { ethers } = require("hardhat")
const fixtures = require('../../../fixtures')
const { parseUnits } = ethers.utils


describe("YakAdapter - Pangolin - Queries", function() {

    let UnilikeAdapterFactory
    let PangolinAdapter
    let PangolinRouter
    let unilikeRouters
    let owner
    let tkns
    let fix

    const ZERO = ethers.constants.Zero

    before(async () => {
        const fixUnilike = await fixtures.unilikeAdapters()
        UnilikeAdapterFactory = fixUnilike.UnilikeAdapterFactory
        adapters = fixUnilike.adapters
        fix = await fixtures.general()
        PangolinRouter = fix.PangolinRouter
        unilikeRouters = fix.unilikeRouters
        tkns = fix.tokenContracts
        owner = fix.deployer
    })

    beforeEach(async () => {
        // Start each test with a fresh account
        trader = fix.genNewAccount()
        // Start each test with a fresh adapter
        PangolinAdapter = await UnilikeAdapterFactory.connect(owner).deploy(
            'Pangolin YakAdapter',
            fix.unilikeFactories.pangolin,
            3,
            100000
        )
    })

    it('Query-exact-path should match underlying router', async () => {
        // Options
        let amountIn = ethers.utils.parseUnits('100')
        let tokenIn = tkns.WAVAX.address
        let tokenOut = tkns.PNG.address
        // Query adapter
        let amountOutAdapter = await PangolinAdapter.query(
            amountIn, tokenIn, tokenOut
        )
        // Query dex router
        let amountOutRouter = await PangolinRouter.getAmountsOut(
            amountIn, [ tokenIn, tokenOut ]
        ).then(amounts => amounts[amounts.length - 1])
        // Compare
        expect(amountOutAdapter).to.equal(amountOutRouter)
    })

    it('Query tokens should match underlying router', async () => {
        // Options
        let amountIn = ethers.utils.parseUnits('100')
        let path = [
            tkns.WAVAX.address,
            tkns.DAI.address
        ]
        // Query adapter
        let amountOutAdapter = await PangolinAdapter.query(
            amountIn, path[0], path[1]
        )
        // Query dex router
        let amountOutRouter = await PangolinRouter.getAmountsOut(
            amountIn, path
        ).then(amounts => amounts[amounts.length - 1])
        // Compare
        expect(amountOutAdapter).to.equal(amountOutRouter)
    })

    it('Query tokens should work despite invalid path (tokenIn)', async () => {
        // Options
        let amountIn = ethers.utils.parseUnits('100')
        let path = [
            tkns.WAVAX.address,
            tkns.DAI.address
        ]        
        // Query adapter
        let amountOutAdapter = await PangolinAdapter.query(
            amountIn, path[0], path[1]
        )
        // Query dex router for all possible combination of paths
        let amountsOutRouter = []
        amountsOutRouter.push(await PangolinRouter.getAmountsOut(
            amountIn, path
        ).then(amounts => amounts[amounts.length - 1]))

        // Compare
        let maxAmountOutRouter = amountsOutRouter.reduce((a, b) => a.gt(b) ? a : b)
        expect(amountOutAdapter).to.equal(maxAmountOutRouter)
    })

    it('Query tokens should work despite invalid path (tokenOut)', async () => {
        // Options
        let amountIn = ethers.utils.parseUnits('100')
        let path = [
            tkns.DAI.address,
            tkns.WAVAX.address
        ]
        
        // Query adapter
        let amountOutAdapter = await PangolinAdapter.query(
            amountIn, path[0], path[1]
        )
        // Query dex router for all possible combination of paths
        let amountsOutRouter = []
        amountsOutRouter.push(await PangolinRouter.getAmountsOut(
            amountIn, path
        ).then(amounts => amounts[amounts.length - 1]))

        // Compare
        let maxAmountOutRouter = amountsOutRouter.reduce((a, b) => a.gt(b) ? a : b)
        expect(amountOutAdapter).to.equal(maxAmountOutRouter)
    })

    it('Query tokens should work with big amounts', async () => {
        // Options
        let path = [
            tkns.DAI.address,
            tkns.WAVAX.address
        ]
        let amountIn = ethers.utils.parseUnits('100000000')
        // Query adapter
        let amountOutAdapter = await PangolinAdapter.query(
            amountIn, path[0], path[1]
        )
        expect(amountOutAdapter.gt(ZERO)).to.be.true
    })

    it('Query should return zero if there is no path between tokens', async () => {
        // Options
        let path = [
            tkns.DAI.address,
            tkns.FRAX.address,
        ]
        let amountIn = ethers.utils.parseUnits('1000')
        // Query adapter
        let amountOutAdapter = await PangolinAdapter.query(
            amountIn, path[0], path[1]
        )
        // Querying original router should cause a revert
        await expect(
            PangolinRouter.getAmountsOut(
                amountIn, path
            ).then(amounts => amounts[amounts.length - 1])
        ).to.reverted
        expect(amountOutAdapter).to.equal(ZERO)
    })

    it('Query should return zero if amountIn is zero', async () => {
        // Options
        let path = [
            tkns.DAI.address,
            tkns.FRAX.address,
        ]
        let amountIn = ZERO
        // Query adapter
        let amountOutAdapter = await PangolinAdapter.query(
            amountIn, path[0], path[1]
        )
        expect(amountOutAdapter).to.equal(ZERO)
    })

    it('Query should return zero if start and end token are the same', async () => {
        // Options
        let path = [
            tkns.WAVAX.address,
            tkns.WAVAX.address,
        ]
        let amountIn = ethers.utils.parseUnits('10')
        // Query adapter
        let amountOutAdapter = await PangolinAdapter.query(
            amountIn, path[0], path[1]
        )
        expect(amountOutAdapter).to.equal(ZERO)
    })
})
