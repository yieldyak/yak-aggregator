const { expect } = require("chai")
const { ethers } = require("hardhat")
const fixtures = require('../../fixtures')
const { setERC20Bal, makeAccountGen } = require('../../helpers')
const { parseUnits } = ethers.utils

describe.only("YakAdapter - MiniYak", function() {

    let genNewAccount
    let MiniYakAdapter
    let mYAK
    let YAK

    before(async () => {
        genNewAccount = await makeAccountGen()
        const fix = await fixtures.miniYakAdapter()
        MiniYakAdapter = fix.adapter
        mYAK = fix.tkns.mYAK
        YAK = fix.tkns.YAK
    })
    
    describe('query', async () => {
        
        it('mYAK/YAK should be 1M', async () => {
            const tknIn = YAK
            const tknOut = mYAK
            const amountIn = parseUnits('1', await tknIn.decimals())
            expect(await MiniYakAdapter.query(amountIn, tknIn.address, tknOut.address))
                .to.equal(amountIn)
        })
    
        it('YAK/mYAK should be 1μ', async () => {
            const tknIn = mYAK
            const tknOut = YAK
            const amountIn = parseUnits('1', await tknIn.decimals())
            expect(await MiniYakAdapter.query(amountIn, tknIn.address, tknOut.address))
                .to.equal(amountIn)
        })
    
        it('Return 0 if swap isnt YAK-mYAK or mYAK-YAK', async () => {
            const tknIn = mYAK
            const tknOut = mYAK
            const amountIn = parseUnits('1', await tknIn.decimals())
            expect(await MiniYakAdapter.query(amountIn, tknIn.address, tknOut.address))
                .to.equal(0)
        })

    })
        

    describe('swap', async () => {

        let trader

        before(async () => {
            // Get the trader
            trader = genNewAccount()
        })

        it('Revert if swap isnt YAK-mYAK or mYAK-YAK', async () => {
            await expect(MiniYakAdapter.swap(
                '0', 
                '0',
                YAK.address, 
                YAK.address, 
                trader.address
            )).to.revertedWith('MiniYakAdapter: Unsupported token')
        })
        
        
        it('mYak/Yak should be 1M - moon', async () => {
            // Get trader some YAK
            const mintYAKAmount = parseUnits('10', await YAK.decimals())
            await setERC20Bal(YAK.address, mintYAKAmount, trader.address, 4)
            expect(await YAK.balanceOf(trader.address)).to.equal(mintYAKAmount)
            // Swap
            const tknIn = YAK
            const tknOut = mYAK
            const amountIn = parseUnits('1', await tknIn.decimals())
            await tknIn.transfer(MiniYakAdapter.address, amountIn)
            const swap = () => MiniYakAdapter.swap(
                amountIn,
                '0', 
                tknIn.address, 
                tknOut.address,
                trader.address
            )
            await expect(swap).to.changeTokenBalance(
                mYAK, trader, amountIn
            )
        })
                
            
        it('YAK/mYAK should be 1μ - unmoon', async () => {
            // Get trader some mYak
            const mintMiniYAKAmount = parseUnits('1', await mYAK.decimals())
            await setERC20Bal(mYAK.address, mintMiniYAKAmount, trader.address, 0)
            expect(await mYAK.balanceOf(trader.address)).to.equal(mintMiniYAKAmount)
            // Swap
            const tknIn = mYAK
            const tknOut = YAK
            const amountIn = parseUnits('1', await tknIn.decimals())
            await tknIn.transfer(MiniYakAdapter.address, amountIn)
            const swap = () => MiniYakAdapter.swap(
                amountIn,
                '0', 
                tknIn.address, 
                tknOut.address,
                trader.address
            )
            await expect(swap).to.changeTokenBalance(
                YAK, trader, amountIn
            )
        })

    })
})
        