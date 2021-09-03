const { expect } = require("chai")
const { ethers } = require("hardhat")
const fixtures = require('../../../fixtures')
const { parseUnits, formatUnits } = ethers.utils

describe("YakAdapter - Gondola", function() {

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

    describe('GondolaDAI', () => {
        
        it('Querying adapter matches the price from original contract', async () => {
            // Options
            let tokenFrom = tkns.DAI
            let tokenTo = tkns.ZDAI
            let amountIn = parseUnits('1000', await tokenFrom.decimals())
            // Querying adapter 
            let amountOutAdapter = await adapters.GondolaDAIAdapter.query(amountIn, tokenFrom.address, tokenTo.address)
            // Querying original contract
            let fromIndex = await pools.GondolaDAI.getTokenIndex(tokenFrom.address)
            let toIndex = await pools.GondolaDAI.getTokenIndex(tokenTo.address)
            let amountOutOriginal = await pools.GondolaDAI.calculateSwap(fromIndex, toIndex, amountIn)
            // Comparing the prices
            expect(amountOutOriginal).to.equal(amountOutAdapter)
        })
    
        it('Querying starting token that is not covered by adapter returns zero as output amount', async () => {
            // Options
            let tokenFrom = tkns.TUSD
            let tokenTo = tkns.DAI
            let amountIn = parseUnits('1000', await tokenFrom.decimals())
            // Confirm that tokenFrom is not supported
            await expect(pools.GondolaDAI.getTokenIndex(tokenFrom.address)).to.revertedWith('Token does not exist')
            // Querying adapter 
            let amountOutAdapter = await adapters.GondolaDAIAdapter.query(amountIn, tokenFrom.address, tokenTo.address)
            // Output amount should be fix.ZERO
            expect(amountOutAdapter).to.equal(fix.ZERO)
        })
    
        it('Querying ending token that is not covered by adapter returns zero as output amount', async () => {
            // Options
            let tokenFrom = tkns.DAI
            let tokenTo = tkns.TUSD
            let amountIn = parseUnits('1000', await tokenFrom.decimals())
            // Confirm that tokenTo is not supported
            await expect(pools.GondolaDAI.getTokenIndex(tokenTo.address)).to.revertedWith('Token does not exist')
            // Querying adapter 
            let amountOutAdapter = await adapters.GondolaDAIAdapter.query(amountIn, tokenFrom.address, tokenTo.address)
            // Output amount should be fix.ZERO
            expect(amountOutAdapter).to.equal(fix.ZERO)
        })

        it('Query should return zero if amountIn is zero', async () => {
            // Options
            let tokenFrom = tkns.DAI
            let tokenTo = tkns.ZDAI
            let amountIn = fix.ZERO
            // Query adapter
            let amountOutAdapter = await adapters.GondolaDAIAdapter.query(amountIn, tokenFrom.address, tokenTo.address)
            expect(amountOutAdapter).to.equal(fix.ZERO)
        })

        it('Query should return zero if pool is paused', async () => {
            // Impersonate contract owner to pause the pool
            let contractOwnerAddress = await pools.GondolaDAI.owner()
            await hre.network.provider.request({
                method: "hardhat_impersonateAccount",
                params: [contractOwnerAddress]}
            )
            let contractOwner = ethers.provider.getSigner(contractOwnerAddress)
            await pools.GondolaDAI.connect(contractOwner).pause()
            // Options
            let tokenFrom = tkns.TUSD
            let tokenTo = tkns.FRAX
            let amountIn = parseUnits('1000', await tokenFrom.decimals())
            // Query adapter
            let amountOutAdapter = await adapters.GondolaDAIAdapter.query(amountIn, tokenFrom.address, tokenTo.address)
            expect(amountOutAdapter).to.equal(fix.ZERO)
            // Reset it
            await pools.GondolaDAI.connect(contractOwner).unpause()
        })
    
        it('Swapping matches query (small num)', async () => {
    
            // Options
            let tokenFrom = tkns.DAI
            let tokenTo = tkns.ZDAI
            let amountIn = parseUnits('1', await tokenFrom.decimals())
    
            // Querying adapter 
            let amountOutAdapter = await adapters.GondolaDAIAdapter.query(
                amountIn, 
                tokenFrom.address, 
                tokenTo.address
            )
    
            // Preparing for swap
            await tkns.WAVAX.connect(trader).approve( fix.PangolinRouter.address, fix.U256_MAX)
            await  fix.PangolinRouter.connect(trader).swapAVAXForExactTokens(
                amountIn,  // Amount of tkns.USDT required to continue 
                [ tkns.WAVAX.address, tokenFrom.address ],
                trader.address,
                parseInt(Date.now()/1e3)+300, 
                { value: ethers.utils.parseEther('100') }
            )
    
            // Swapping
            let traderRecvTknBalBefore = await tokenTo.balanceOf(trader.address)
            await tokenFrom.connect(trader).transfer(adapters.GondolaDAIAdapter.address, amountIn)
            await adapters.GondolaDAIAdapter.connect(trader).swap(
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
            let _GondolaDAIAdapter = await CurveLikeAdapterFactory.connect(fix.deployer).deploy(
                'pools.GondolaDAI YakAdapter',
                 fix.curvelikePools.GondolaDAI, 
                2,  // Token-count
                150000
            )
            // Check that expected tokens are supported
            for (let tkn of [tkns.DAI, tkns.ZDAI]) {
                expect(await _GondolaDAIAdapter.TOKENS_MAP(tkn.address)).to.be.true
            }
        })   
        
    })
    
    describe('GondolaBTC', () => {
        
        it('Querying adapter matches the price from original contract', async () => {
            // Options
            let tokenFrom = tkns.WBTC
            let tokenTo = tkns.ZBTC
            let amountIn = parseUnits('1000', await tokenFrom.decimals())
            // Querying adapter 
            let amountOutAdapter = await adapters.GondolaBTCAdapter.query(amountIn, tokenFrom.address, tokenTo.address)
            // Querying original contract
            let fromIndex = await pools.GondolaBTC.getTokenIndex(tokenFrom.address)
            let toIndex = await pools.GondolaBTC.getTokenIndex(tokenTo.address)
            let amountOutOriginal = await pools.GondolaBTC.calculateSwap(fromIndex, toIndex, amountIn)
            // Comparing the prices
            expect(amountOutOriginal).to.equal(amountOutAdapter)
        })
    
        it('Swapping matches query', async () => {
            // Options
            let tokenFrom = tkns.WBTC
            let tokenTo = tkns.ZBTC
            let amountIn = parseUnits('0.01', await tokenFrom.decimals())
    
            // Querying adapter 
            let amountOutAdapter = await adapters.GondolaBTCAdapter.query(
                amountIn, 
                tokenFrom.address, 
                tokenTo.address
            )
    
            // Preparing for swap
            await tkns.WAVAX.connect(trader).approve( fix.PangolinRouter.address, fix.U256_MAX)
            await  fix.PangolinRouter.connect(trader).swapAVAXForExactTokens(
                amountIn,  // Amount of tkns.USDT required to continue 
                [ tkns.WAVAX.address, tokenFrom.address ],
                trader.address,
                parseInt(Date.now()/1e3)+300, 
                { value: ethers.utils.parseEther('100') }
            )
    
            // Swapping
            let traderRecvTknBalBefore = await tokenTo.balanceOf(trader.address)
            await tokenFrom.connect(trader).transfer(adapters.GondolaBTCAdapter.address, amountIn)
            await adapters.GondolaBTCAdapter.connect(trader).swap(
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

    })

    // ! NOTE: Paused pool
    describe('GondolaUSDT', () => {
        
        it('Querying adapter matches the price from original contract', async () => {
            // Options
            let tokenFrom = tkns.USDT
            let tokenTo = tkns.ZUSDT
            let amountIn = parseUnits('1', await tokenFrom.decimals())
            // Querying adapter 
            let amountOutAdapter = await adapters.GondolaUSDTAdapter.query(amountIn, tokenFrom.address, tokenTo.address)
            expect(amountOutAdapter).to.equal(fix.ZERO)
        })
    
        it('Swapping matches query', async () => {
            // Options
            let tokenFrom = tkns.USDT
            let tokenTo = tkns.ZUSDT
            let amountIn = parseUnits('0.01', await tokenFrom.decimals())
    
            // Querying adapter 
            let amountOutAdapter = await adapters.GondolaUSDTAdapter.query(
                amountIn, 
                tokenFrom.address, 
                tokenTo.address
            )
    
            // Preparing for swap
            await tkns.WAVAX.connect(trader).approve( fix.PangolinRouter.address, fix.U256_MAX)
            await  fix.PangolinRouter.connect(trader).swapAVAXForExactTokens(
                amountIn,  // Amount of tkns.USDT required to continue 
                [ tkns.WAVAX.address, tokenFrom.address ],
                trader.address,
                parseInt(Date.now()/1e3)+300, 
                { value: ethers.utils.parseEther('100') }
            )
            await tokenFrom.connect(trader).transfer(adapters.GondolaUSDTAdapter.address, amountIn)
            // Swapping
            await expect(adapters.GondolaUSDTAdapter.connect(trader).swap(
                amountIn, 
                amountOutAdapter, 
                tokenFrom.address,
                tokenTo.address, 
                trader.address
            )).to.be.revertedWith('Pausable: paused')
    
        })

    })

    describe('GondolaETH', () => {
        
        it('Querying adapter matches the price from original contract', async () => {
            // Options
            let tokenFrom = tkns.ETH
            let tokenTo = tkns.ZETH
            let amountIn = parseUnits('1', await tokenFrom.decimals())
            // Querying adapter 
            let amountOutAdapter = await adapters.GondolaETHAdapter.query(amountIn, tokenFrom.address, tokenTo.address)
            // Querying original contract
            let fromIndex = await pools.GondolaETH.getTokenIndex(tokenFrom.address)
            let toIndex = await pools.GondolaETH.getTokenIndex(tokenTo.address)
            let amountOutOriginal = await pools.GondolaETH.calculateSwap(fromIndex, toIndex, amountIn)
            // Comparing the prices
            expect(amountOutOriginal).to.equal(amountOutAdapter)
        })
    
        it('Swapping matches query', async () => {
            // Options
            let tokenFrom = tkns.ETH
            let tokenTo = tkns.ZETH
            let amountIn = parseUnits('0.01', await tokenFrom.decimals())
    
            // Querying adapter 
            let amountOutAdapter = await adapters.GondolaETHAdapter.query(
                amountIn, 
                tokenFrom.address, 
                tokenTo.address
            )
    
            // Preparing for swap
            await tkns.WAVAX.connect(trader).approve( fix.PangolinRouter.address, fix.U256_MAX)
            await  fix.PangolinRouter.connect(trader).swapAVAXForExactTokens(
                amountIn,  // Amount of tkns.USDT required to continue 
                [ tkns.WAVAX.address, tokenFrom.address ],
                trader.address,
                parseInt(Date.now()/1e3)+300, 
                { value: ethers.utils.parseEther('100') }
            )
            
    
            // Swapping
            let traderRecvTknBalBefore = await tokenTo.balanceOf(trader.address)
            await tokenFrom.connect(trader).transfer(adapters.GondolaETHAdapter.address, amountIn)
            await adapters.GondolaETHAdapter.connect(trader).swap(
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

    })

    describe('GondolaUSDTUSDTe', () => {

        it('Querying adapter matches the price from original contract', async () => {
            // Options
            let tokenFrom = tkns.USDT
            let tokenTo = tkns.USDTe
            let amountIn = parseUnits('1000000000000000000000000000000000', await tokenFrom.decimals())
            // Querying adapter 
            let amountOutAdapter = await adapters.GondolaUSDTUSDTeAdapter.query(amountIn, tokenFrom.address, tokenTo.address)
            console.log(formatUnits(amountOutAdapter))
            // Querying original contract
            let fromIndex = await pools.GondolaUSDTUSDTe.getTokenIndex(tokenFrom.address)
            let toIndex = await pools.GondolaUSDTUSDTe.getTokenIndex(tokenTo.address)
            let amountOutOriginal = await pools.GondolaUSDTUSDTe.calculateSwap(fromIndex, toIndex, amountIn)
            // Comparing the prices
            expect(amountOutOriginal).to.equal(amountOutAdapter)
        })

    })

    describe('GondolaUSDCeUSDTe', () => {
        
        it('Querying adapter returns zero if there is an error', async () => {
            // Options
            let tokenFrom = tkns.USDCe
            let tokenTo = tkns.USDTe
            let amountIn = ethers.constants.MaxInt256
            // Querying adapter 
            expect(await adapters.GondolaUSDTeUSDCeAdapter.query(amountIn, tokenFrom.address, tokenTo.address))
                .to.equal('0')
            // Querying original contract
            let fromIndex = await pools.GondolaUSDTeUSDCe.getTokenIndex(tokenFrom.address)
            let toIndex = await pools.GondolaUSDTeUSDCe.getTokenIndex(tokenTo.address)
            await expect(pools.GondolaUSDTeUSDCe.calculateSwap(fromIndex, toIndex, amountIn))
                .to.revertedWith('SafeMath: multiplication overflow')
        })
    })

})
