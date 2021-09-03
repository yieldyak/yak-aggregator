const { expect } = require("chai")
const { ethers } = require("hardhat")
const fixtures = require('../../fixtures')
const { parseUnits } = ethers.utils

describe("YakAdapter - Synapse", function() {

    let SynapseAdapterFactory
    let SynapseAdapter
    let SynapsePool
    let deployer
    let genNewAccount
    let PangolinRouter
    let tkns

    before(async () => {
        const fixSynapse = await fixtures.synapseAdapter()
        SynapseAdapterFactory = fixSynapse.SynapseAdapterFactory
        SynapseAdapter = fixSynapse.SynapseAdapter
        SynapsePool = fixSynapse.SynapsePool
        deployer = fixSynapse.deployer
        fix = await fixtures.general()
        tkns = fix.tokenContracts
        genNewAccount = fix.genNewAccount
        PangolinRouter = fix.PangolinRouter
    })

    beforeEach(async () => {
        trader = genNewAccount()
    })
        
    it('Querying adapter matches the price from original contract minus the fee', async () => {
        // Options
        const tokenFrom = tkns.NUSD
        const tokenTo = tkns.USDTe
        const applyFee = amountBn => amountBn.mul(9996).div(1e4)
        let tokenFromIndex = 0
        let tokenToIndex = 3
        let amountIn = parseUnits('1000', await tokenFrom.decimals())
        // Querying adapter 
        let amountOutAdapter = await SynapseAdapter.query(amountIn, tokenFrom.address, tokenTo.address)
        // Querying original contract
        let amountOutOriginal = await SynapsePool.calculateSwapUnderlying(tokenFromIndex, tokenToIndex, amountIn)
        // Comparing the prices
        expect(applyFee(amountOutOriginal)).to.equal(amountOutAdapter)
    })

    it('Querying starting token that is not covered by adapter returns zero as output amount', async () => {
        // Options
        let tokenFrom = tkns.TUSD
        let tokenTo = tkns.USDCe
        let amountIn = parseUnits('1000', await tokenFrom.decimals())
        // Output amount should be zero
        expect(await SynapseAdapter.query(amountIn, tokenFrom.address, tokenTo.address)).to.equal(fix.ZERO)
    })

    it('Querying ending token that is not covered by adapter returns zero as output amount', async () => {
        // Options
        let tokenFrom = tkns.DAIe
        let tokenTo = tkns.TUSD
        let amountIn = parseUnits('1000', await tokenFrom.decimals())
        // Output amount should be zero
        expect(await SynapseAdapter.query(amountIn, tokenFrom.address, tokenTo.address)).to.equal('0')
    })

    it('Query should return zero if amountIn is zero', async () => {
        // Options
        let tokenFrom = tkns.DAIe
        let tokenTo = tkns.USDTe
        let amountIn = parseUnits('0')
        // Query adapter
        expect(await SynapseAdapter.query(amountIn, tokenFrom.address, tokenTo.address)).to.equal('0')
    })

    it('Query should return zero if pool is paused', async () => {
        // Impersonate contract owner to pause the pool and fund the account
        let contractOwnerAddress = await SynapsePool.owner()
        await trader.sendTransaction({to: contractOwnerAddress, value: parseUnits('5')})
        await hre.network.provider.request({
            method: "hardhat_impersonateAccount",
            params: [contractOwnerAddress]
        })
        let contractOwner = ethers.provider.getSigner(contractOwnerAddress)
        await SynapsePool.connect(contractOwner).pause()
        // Options
        let tokenFrom = tkns.DAIe
        let tokenTo = tkns.NUSD
        let amountIn = parseUnits('1000', await tokenFrom.decimals())
        // Query adapter
        let amountOutAdapter = await SynapseAdapter.query(
            amountIn, 
            tokenFrom.address, 
            tokenTo.address
        )
        expect(amountOutAdapter).to.equal(fix.ZERO)
        // Reset it
        await SynapsePool.connect(contractOwner).unpause()
    })

    it('Swapping matches query (small num)', async () => {
        // Options
        let tokenFrom = tkns.USDCe
        let tokenTo = tkns.NUSD
        let amountIn = parseUnits('1000', await tokenFrom.decimals())
        // Querying adapter 
        let amountOutAdapter = await SynapseAdapter.query(
            amountIn, 
            tokenFrom.address, 
            tokenTo.address
        )
        // Preparing for swap
        await PangolinRouter.connect(trader).swapAVAXForExactTokens(
            amountIn,  // Amount of tkns.USDT required to continue 
            [ tkns.WAVAX.address, tokenFrom.address ],
            trader.address,
            parseInt(Date.now()/1e3)+300, 
            { value: parseUnits('100') }
        )
        // Swapping
        await tokenFrom.connect(trader).transfer(SynapseAdapter.address, amountIn)
        let swap = () => SynapseAdapter.connect(trader).swap(
            amountIn, 
            amountOutAdapter, 
            tokenFrom.address,
            tokenTo.address, 
            trader.address
        )
        await expect(swap).to.changeTokenBalance(tokenTo, trader, amountOutAdapter)
    })

    it('Swapping matches query (big num)', async () => {
        // Options
        let tokenFrom = tkns.USDTe
        let tokenTo = tkns.USDCe
        let amountIn = parseUnits('25000', await tokenFrom.decimals())

        // Querying adapter 
        let amountOutAdapter = await SynapseAdapter.query(
            amountIn, 
            tokenFrom.address, 
            tokenTo.address
        )
        // Preparing for swap
        await fix.PangolinRouter.connect(trader).swapAVAXForExactTokens(
            amountIn,  // Amount of tkns.USDT required to continue 
            [ tkns.WAVAX.address, tokenFrom.address ],
            trader.address,
            parseInt(Date.now()/1e3)+300, 
            { value: parseUnits('1000000') }
        )
        
        // Swapping
        await tokenFrom.connect(trader).transfer(SynapseAdapter.address, amountIn)
        let swap = () => SynapseAdapter.connect(trader).swap(
            amountIn, 
            amountOutAdapter,
            tokenFrom.address,
            tokenTo.address, 
            trader.address
        )
        await expect(swap).to.changeTokenBalance(tokenTo, trader, amountOutAdapter)
    })

    it('Initializing the adapter should set pool-tokens map', async () => {
        // Create a new instance of adapter
        let _SynapseAdapter = await SynapseAdapterFactory.connect(fix.deployer).deploy(
            'SnobF3D YakAdapter',
            fix.curvelikePools.SynapseDAIeUSDCeUSDTeNUSD, 
            170000
        )
        // Check that expected tokens are supported
        for (let tkn of [tkns.DAIe, tkns.USDTe, tkns.USDCe, tkns.NUSD]) {
            expect(await _SynapseAdapter.isPoolToken(tkn.address)).to.be.true
        }
    })

})
