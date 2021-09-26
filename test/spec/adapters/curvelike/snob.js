const { expect } = require("chai")
const { ethers } = require("hardhat")
const fixtures = require('../../../fixtures')
const { parseUnits } = ethers.utils

describe("YakAdapter - Snob", function() {

    let CurveLikeAdapterFactory
    let adapters
    let pools
    let tkns
    let fix

    before(async () => {
        const fixCurvelike = await fixtures.curvelikeAdapters()
        CurveLikeAdapterFactory = fixCurvelike.CurveLikeAdapterFactory
        adapters = fixCurvelike.adapters
        pools = fixCurvelike.pools
        fix = await fixtures.general()
        tkns = fix.tokenContracts
    })

    beforeEach(async () => {
        trader = fix.genNewAccount()
    })

    describe('snobF3D', () => {
        
        it('Querying adapter matches the price from original contract', async () => {
            // Options
            let tokenFrom = tkns.FRAX
            let tokenTo = tkns.TUSD
            let amountIn = parseUnits('1000', await tokenFrom.decimals())
            // Querying adapter 
            let amountOutAdapter = await adapters.SnobF3DAdapter.query(amountIn, tokenFrom.address, tokenTo.address)
            // Querying original contract
            let fromIndex = await pools.SnobF3D.getTokenIndex(tokenFrom.address)
            let toIndex = await pools.SnobF3D.getTokenIndex(tokenTo.address)
            let amountOutOriginal = await pools.SnobF3D.calculateSwap(fromIndex, toIndex, amountIn)
            // Comparing the prices
            expect(amountOutOriginal).to.equal(amountOutAdapter)
        })
    
        it('Querying starting token that is not covered by adapter returns zero as output amount', async () => {
            // Options
            let tokenFrom = tkns.DAI
            let tokenTo = tkns.TUSD
            let amountIn = parseUnits('1000', await tokenFrom.decimals())
            // Confirm that tokenFrom is not supported
            await expect(pools.SnobF3D.getTokenIndex(tokenFrom.address)).to.revertedWith('Token does not exist')
            // Output amount should be zero
            expect(await adapters.SnobF3DAdapter.query(amountIn, tokenFrom.address, tokenTo.address)).to.equal(fix.ZERO)
        })
    
        it('Querying ending token that is not covered by adapter returns zero as output amount', async () => {
            // Options
            let tokenFrom = tkns.TUSD
            let tokenTo = tkns.DAI
            let amountIn = parseUnits('1000', await tokenFrom.decimals())
            // Confirm that tokenTo is not supported
            await expect(pools.SnobF3D.getTokenIndex(tokenTo.address)).to.revertedWith('Token does not exist')
            // Output amount should be zero
            expect(await adapters.SnobF3DAdapter.query(amountIn, tokenFrom.address, tokenTo.address)).to.equal(fix.ZERO)
        })

        it('Query should return zero if amountIn is zero', async () => {
            // Options
            let tokenFrom = tkns.TUSD
            let tokenTo = tkns.FRAX
            let amountIn = fix.ZERO
            // Query adapter
            expect(await adapters.SnobF3DAdapter.query(amountIn, tokenFrom.address, tokenTo.address)).to.equal(fix.ZERO)
        })

        it('Query should return zero if pool is paused', async () => {
            // Impersonate contract owner to pause the pool
            let contractOwnerAddress = await pools.SnobF3D.owner()
            await hre.network.provider.request({
                method: "hardhat_impersonateAccount",
                params: [contractOwnerAddress]
            })
            let contractOwner = ethers.provider.getSigner(contractOwnerAddress)
            await pools.SnobF3D.connect(contractOwner).pause()
            // Options
            let tokenFrom = tkns.TUSD
            let tokenTo = tkns.FRAX
            let amountIn = parseUnits('1000', await tokenFrom.decimals())
            // Query adapter
            let amountOutAdapter = await adapters.SnobF3DAdapter.query(
                amountIn, 
                tokenFrom.address, 
                tokenTo.address
            )
            expect(amountOutAdapter).to.equal(fix.ZERO)
            // Reset it
            await pools.SnobF3D.connect(contractOwner).unpause()
        })
    
        it('Swapping matches query (small num)', async () => {
            // Options
            let tokenFrom = tkns.USDT
            let tokenTo = tkns.FRAX
            let amountIn = parseUnits('20', await tokenFrom.decimals())
            // Querying adapter 
            let amountOutAdapter = await adapters.SnobF3DAdapter.query(
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
                { value: parseUnits('100') }
            )
            // Swapping
            await tokenFrom.connect(trader).transfer(adapters.SnobF3DAdapter.address, amountIn)
            let swap = () => adapters.SnobF3DAdapter.connect(trader).swap(
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
            let tokenFrom = tkns.USDT
            let tokenTo = tkns.FRAX
            let amountIn = parseUnits('25000', await tokenFrom.decimals())
    
            // Querying adapter 
            let amountOutAdapter = await adapters.SnobF3DAdapter.query(
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
            await tokenFrom.connect(trader).transfer(adapters.SnobF3DAdapter.address, amountIn)
            let swap = () => adapters.SnobF3DAdapter.connect(trader).swap(
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
            let _SnobF3DAdapter = await CurveLikeAdapterFactory.connect(fix.deployer).deploy(
                'SnobF3D YakAdapter',
                fix.curvelikePools.snobF3D, 
                170000
            )
            // Check that expected tokens are supported
            for (let tkn of [tkns.FRAX, tkns.USDT, tkns.TUSD]) {
                expect(await _SnobF3DAdapter.isPoolToken(tkn.address)).to.be.true
            }
        })

    })

    describe('snobS3D', () => {
        
        it('Querying adapter matches the price from original contract', async () => {
            // Options
            let tokenFrom = tkns.DAI
            let tokenTo = tkns.USDT
            let amountIn = parseUnits('1000', await tokenFrom.decimals())
            // Querying adapter 
            let amountOutAdapter = await adapters.SnobS3DAdapter.query(amountIn, tokenFrom.address, tokenTo.address)
            // Querying original contract
            let fromIndex = await pools.SnobS3D.getTokenIndex(tokenFrom.address)
            let toIndex = await pools.SnobS3D.getTokenIndex(tokenTo.address)
            let amountOutOriginal = await pools.SnobS3D.calculateSwap(fromIndex, toIndex, amountIn)
            // Comparing the prices
            expect(amountOutOriginal).to.equal(amountOutAdapter)
        })
    
        it('Querying starting token that is not covered by adapter returns zero as output amount', async () => {
            // Options
            let tokenFrom = tkns.FRAX
            let tokenTo = tkns.USDT
            let amountIn = parseUnits('1000', await tokenFrom.decimals())
            // Confirm that tokenFrpm is not supported
            await expect(pools.SnobS3D.getTokenIndex(tokenFrom.address)).to.revertedWith('Token does not exist')
            // Querying adapter 
            let amountOutAdapter = await adapters.SnobS3DAdapter.query(amountIn, tokenFrom.address, tokenTo.address)
            // Output amount should be fix.ZERO
            expect(amountOutAdapter).to.equal(fix.ZERO)
        })
    
        it('Querying ending token that is not covered by adapter returns fix.ZERO as output amount', async () => {
            // Options
            let tokenFrom = tkns.USDT
            let tokenTo = tkns.FRAX
            let amountIn = parseUnits('1000', await tokenFrom.decimals())
            // Confirm that tokenTo is not supported
            await expect(pools.SnobS3D.getTokenIndex(tokenTo.address)).to.revertedWith('Token does not exist')
            // Querying adapter 
            let amountOutAdapter = await adapters.SnobS3DAdapter.query(amountIn, tokenFrom.address, tokenTo.address)
            // Output amount should be fix.ZERO
            expect(amountOutAdapter).to.equal(fix.ZERO)
        })

        it('Query should return fix.ZERO if amountIn is fix.ZERO', async () => {
            // Options
            let tokenFrom = tkns.TUSD
            let tokenTo = tkns.DAI
            let amountIn = fix.ZERO
            // Query adapter
            let amountOutAdapter = await adapters.SnobS3DAdapter.query(amountIn, tokenFrom.address, tokenTo.address)
            expect(amountOutAdapter).to.equal(fix.ZERO)
        })

        it('Query should return zero if pool is paused', async () => {
            // Impersonate contract owner to pause the pool
            let contractOwnerAddress = await pools.SnobS3D.owner()
            await hre.network.provider.request({
                method: "hardhat_impersonateAccount",
                params: [contractOwnerAddress]}
            )
            let contractOwner = ethers.provider.getSigner(contractOwnerAddress)
            await pools.SnobS3D.connect(contractOwner).pause()
            // Options
            let tokenFrom = tkns.TUSD
            let tokenTo = tkns.FRAX
            let amountIn = parseUnits('1000', await tokenFrom.decimals())
            // Query adapter
            let amountOutAdapter = await adapters.SnobS3DAdapter.query(amountIn, tokenFrom.address, tokenTo.address)
            expect(amountOutAdapter).to.equal(fix.ZERO)
            // Reset it
            await pools.SnobS3D.connect(contractOwner).unpause()
        })

        it('Swapping matches query (small num)', async () => {
    
            // Options
            let tokenFrom = tkns.USDT
            let tokenTo = tkns.DAI
            let amountIn = parseUnits('1', await tokenFrom.decimals())
    
            // Querying adapter 
            let amountOutAdapter = await adapters.SnobS3DAdapter.query(
                amountIn, 
                tokenFrom.address, 
                tokenTo.address
            )
    
            // Preparing for swap
            await tkns.WAVAX.connect(trader).approve(fix.PangolinRouter.address, fix.U256_MAX)
            await fix.PangolinRouter.connect(trader).swapAVAXForExactTokens(
                amountIn,  // Amount of tkns.USDT required to continue 
                [ tkns.WAVAX.address, tokenFrom.address ],
                trader.address,
                parseInt(Date.now()/1e3)+300, 
                { value: ethers.utils.parseEther('100') }
            )
    
            // Swapping
            let traderRecvTknBalBefore = await tokenTo.balanceOf(trader.address)
            await tokenFrom.connect(trader).transfer(adapters.SnobS3DAdapter.address, amountIn)
            await adapters.SnobS3DAdapter.connect(trader).swap(
                amountIn, 
                amountOutAdapter,
                tokenFrom.address,
                tokenTo.address, 
                trader.address
            )
            let traderRecvTknBalAfter = await tokenTo.balanceOf(trader.address)
            // Comparing results
            expect(
                traderRecvTknBalAfter.sub(traderRecvTknBalBefore)
            ).to.equal(amountOutAdapter)
    
        })

        it('Initializing the adapter should set pool-tokens map', async () => {
            // Create a new instance of adapter
            let _SnobS3DAdapter = await CurveLikeAdapterFactory.connect(fix.deployer).deploy(
                'SnobS3D YakAdapter',
                fix.curvelikePools.snobS3D, 
                170000
            )
            // Check that expected tokens are supported
            for (let tkn of [tkns.DAI, tkns.USDT, tkns.BUSD]) {
                expect(await _SnobS3DAdapter.isPoolToken(tkn.address)).to.be.true
            }
        })

    })

    describe('snobS4D', () => {
        
        it('Querying adapter matches the price from original contract', async () => {
            // Options
            let tokenFrom = tkns.DAIe
            let tokenTo = tkns.TUSD
            let amountIn = parseUnits('1000', await tokenFrom.decimals())
            // Querying adapter 
            let amountOutAdapter = await adapters.SnobS4DAdapter.query(amountIn, tokenFrom.address, tokenTo.address)
            // Querying original contract
            let fromIndex = await pools.SnobS4D.getTokenIndex(tokenFrom.address)
            let toIndex = await pools.SnobS4D.getTokenIndex(tokenTo.address)
            let amountOutOriginal = await pools.SnobS4D.calculateSwap(fromIndex, toIndex, amountIn)
            // Comparing the prices
            expect(amountOutOriginal).to.equal(amountOutAdapter)
        })
    
        it('Querying starting token that is not covered by adapter returns zero as output amount', async () => {
            // Options
            let tokenFrom = tkns.BUSD
            let tokenTo = tkns.DAIe
            let amountIn = parseUnits('1000', await tokenFrom.decimals())
            // Confirm that tokenFrpm is not supported
            await expect(pools.SnobS4D.getTokenIndex(tokenFrom.address)).to.revertedWith('Token does not exist')
            // Querying adapter 
            let amountOutAdapter = await adapters.SnobS4DAdapter.query(amountIn, tokenFrom.address, tokenTo.address)
            // Output amount should be fix.ZERO
            expect(amountOutAdapter).to.equal(fix.ZERO)
        })
    
        it('Querying ending token that is not covered by adapter returns ZERO as output amount', async () => {
            // Options
            let tokenFrom = tkns.DAIe
            let tokenTo = tkns.BUSD
            let amountIn = parseUnits('1000', await tokenFrom.decimals())
            // Confirm that tokenTo is not supported
            await expect(pools.SnobS4D.getTokenIndex(tokenTo.address)).to.revertedWith('Token does not exist')
            // Querying adapter 
            let amountOutAdapter = await adapters.SnobS4DAdapter.query(amountIn, tokenFrom.address, tokenTo.address)
            // Output amount should be fix.ZERO
            expect(amountOutAdapter).to.equal(fix.ZERO)
        })

        it('Query should return zero if amountIn is zero', async () => {
            // Options
            let tokenFrom = tkns.TUSD
            let tokenTo = tkns.DAIe
            let amountIn = fix.ZERO
            // Query adapter
            let amountOutAdapter = await adapters.SnobS4DAdapter.query(amountIn, tokenFrom.address, tokenTo.address)
            expect(amountOutAdapter).to.equal(fix.ZERO)
        })

        it('Query should return zero if pool is paused', async () => {
            // Impersonate contract owner to pause the pool
            let contractOwnerAddress = await pools.SnobS4D.owner()
            // Send the owner some avax
            await trader.sendTransaction({to: contractOwnerAddress, value: parseUnits('2')})
            await hre.network.provider.request({
                method: "hardhat_impersonateAccount",
                params: [contractOwnerAddress]}
            )
            let contractOwner = ethers.provider.getSigner(contractOwnerAddress)
            await pools.SnobS4D.connect(contractOwner).pause()
            // Options
            let tokenFrom = tkns.TUSD
            let tokenTo = tkns.FRAX
            let amountIn = parseUnits('1000', await tokenFrom.decimals())
            // Query adapter
            let amountOutAdapter = await adapters.SnobS4DAdapter.query(amountIn, tokenFrom.address, tokenTo.address)
            expect(amountOutAdapter).to.equal(fix.ZERO)
            // Reset it
            await pools.SnobS4D.connect(contractOwner).unpause()
        })

        it('Swapping matches query (small num)', async () => {
    
            // Options
            let tokenFrom = tkns.TUSD
            let tokenTo = tkns.FRAX
            let amountIn = parseUnits('20', await tokenFrom.decimals())
    
            // Querying adapter 
            let amountOutAdapter = await adapters.SnobS4DAdapter.query(
                amountIn, 
                tokenFrom.address, 
                tokenTo.address
            )
    
            // Preparing for swap
            await tkns.WAVAX.connect(trader).approve(fix.PangolinRouter.address, fix.U256_MAX)
            await fix.PangolinRouter.connect(trader).swapAVAXForExactTokens(
                amountIn,  // Amount of tkns.USDT required to continue 
                [ tkns.WAVAX.address, tokenFrom.address ],
                trader.address,
                parseInt(Date.now()/1e3)+300, 
                { 
                    value: ethers.utils.parseEther('100') 
                }
            )
    
            // Swapping
            let traderRecvTknBalBefore = await tokenTo.balanceOf(trader.address)
            await tokenFrom.connect(trader).transfer(adapters.SnobS4DAdapter.address, amountIn)
            await adapters.SnobS4DAdapter.connect(trader).swap(
                amountIn, 
                amountOutAdapter,
                tokenFrom.address,
                tokenTo.address, 
                trader.address
            )
            let traderRecvTknBalAfter = await tokenTo.balanceOf(trader.address)
            // Comparing results
            expect(
                traderRecvTknBalAfter.sub(traderRecvTknBalBefore)
            ).to.equal(amountOutAdapter)
    
        })
    
        it('Swapping matches query (big num)', async () => {
            // Options
            let tokenFrom = tkns.DAIe
            let tokenTo = tkns.FRAX
            let amountIn = parseUnits('250000', await tokenFrom.decimals())
    
            // Querying adapter 
            let amountOutAdapter = await adapters.SnobS4DAdapter.query(
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
                { 
                    value: ethers.utils.parseEther('1000000') 
                }
            )
    
            // Swapping
            let traderRecvTknBalBefore = await tokenTo.balanceOf(trader.address)
            await tokenFrom.connect(trader).transfer(adapters.SnobS4DAdapter.address, amountIn)
            await adapters.SnobS4DAdapter.connect(trader).swap(
                amountIn, 
                amountOutAdapter, 
                tokenFrom.address,
                tokenTo.address, 
                trader.address
            )
            let traderRecvTknBalAfter = await tokenTo.balanceOf(trader.address)
            // Comparing results
            expect(
                traderRecvTknBalAfter.sub(traderRecvTknBalBefore)
            ).to.equal(amountOutAdapter)
    
        })

        it('Initializing the adapter should set pool-tokens map', async () => {
            // Create a new instance of adapter
            let _SnobS4DAdapter = await CurveLikeAdapterFactory.connect(fix.deployer).deploy(
                'SnobS4D YakAdapter',
                fix.curvelikePools.snobS4D, 
                180000
            )
            // Check that expected tokens are supported
            for (let tkn of [tkns.DAIe, tkns.USDTe, tkns.TUSD, tkns.FRAX]) {
                expect(await _SnobS4DAdapter.isPoolToken(tkn.address)).to.be.true
            }
        })

    })

})
