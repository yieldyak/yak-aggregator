const { expect } = require("chai")
const { ethers } = require("hardhat")
const fixtures = require('../../../fixtures')
const { parseUnits } = ethers.utils


describe("YakAdapter Swaps", function() {

    let UnilikeAdapterFactory
    let ZeroAdapter
    let ZeroRouter
    let unilikeRouters
    let owner
    let tkns
    let fix
    
    const ZERO  = ethers.constants.Zero

    before(async () => {
        const fixUnilike = await fixtures.unilikeAdapters()
        UnilikeAdapterFactory = fixUnilike.UnilikeAdapterFactory
        fix = await fixtures.general()
        ZeroRouter = fix.ZeroRouter
        unilikeRouters = fix.unilikeRouters
        tkns = fix.tokenContracts
        owner = fix.deployer
    })

    beforeEach(async () => {
        // Start each test with a fresh account
        trader = fix.genNewAccount()
        // Start each test with a fresh adapter
        ZeroAdapter = await UnilikeAdapterFactory.connect(owner).deploy(
            'Pangolin YakAdapter',
            fix.unilikeFactories.pangolin,
            3,
            100000
        )
    })

    it('Swap returned amount should match underlying router quote', async () => {
        // Options
        let amountIn = parseUnits('10')
        let tokenFrom = fix.tokenContracts.WAVAX
        let tokenTo = fix.tokenContracts.ZERO
        // Query
        let amountOutAdapter = await ZeroAdapter.query(
            amountIn, tokenFrom.address, tokenTo.address
        )
        // Swap
        await tokenFrom.connect(trader).deposit({value: amountIn})
        await tokenFrom.connect(trader).transfer(ZeroAdapter.address, amountIn)
        const swap = () => ZeroAdapter.connect(trader).swap(
            amountIn, 
            amountOutAdapter, 
            tokenFrom.address, 
            tokenTo.address, 
            trader.address, 
        )
        // Swap and compare
        await expect(swap).to.changeTokenBalance(tokenTo, trader, amountOutAdapter)
    })
    
})