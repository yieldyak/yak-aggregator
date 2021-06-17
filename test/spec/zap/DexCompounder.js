const { expect } = require("chai")
const { ethers } = require("hardhat")
const fixtures = require('../../fixtures')
const { parseUnits } = ethers.utils
const helpers = require('../../helpers')

describe("Yak Zap", function() {

    let YakCompounder
    let ZapRouter
    let PGLPair
    let trader
    let fix
    let WAVAX
    let getDeadline

    before(async () => {
        fix = await fixtures.general()
        const fixtureZap = await fixtures.zap()
        YakCompounder = fixtureZap.YakCompounder
        ZapRouter = fixtureZap.ZapRouter
        PGLPair = fixtureZap.PGL_WAVAX_PNG_PAIR
        tkns = fix.tokenContracts
        getDeadline = fixtureZap.getDeadline
        WAVAX = await ethers.getContractAt('contracts/interface/IWAVAX.sol:IWAVAX', fix.assets.WAVAX)
    })

    beforeEach(async () => {
        trader = fix.genNewAccount()
    })
    
    describe("Pangolin", async () => {
        it('Zap Deposit WAVAX PNG into PGL WAVAX-PNG auto-compounder', async () => {
            
            let PNGToken = tkns.PNG
            await helpers.approveERC20(trader, PNGToken.address, ZapRouter.address, ethers.constants.MaxUint256)
            await helpers.approveERC20(trader, WAVAX.address, ZapRouter.address, ethers.constants.MaxUint256)
            let reservesResponse = await PGLPair.getReserves()
            let reserves0 = reservesResponse.reserve0
            let reserves1 = reservesResponse.reserve1

            let bigOne = parseUnits("1", await PNGToken.decimals());
            let amountIn0 = parseUnits('1', await PNGToken.decimals())
            let amountIn1 = amountIn0.mul(reserves1.mul(bigOne).div(reserves0)).div(bigOne)
            let amountInMin0 = amountIn0.sub(amountIn0.mul(bigOne).mul(5).div(bigOne.mul(1000))) //0.5% slippage
            let amountInMin1 = amountInMin0.mul(reserves1.mul(bigOne).div(reserves0)).div(bigOne) //0.5% slippage
            
            // funds the wallet with 3x WAVAX
            await WAVAX.connect(trader).deposit({ value: amountIn1.mul(3).toString() }) 
            // swaps some WAVAX for PNG to fund the wallet, we don't care if we send more WAVAX
            // than we need PNG here, we just want to be sure we are able to acquire enough PNG
            await WAVAX.connect(trader).transfer(PGLPair.address, amountIn1.mul(2).toString())
            let amountInWithFee = amountIn1.mul(997);
            let numerator = amountInWithFee.mul(reserves0);
            let denominator = reserves1.mul(1000).add(amountInWithFee);
            let amountOut = numerator.div(denominator)
            // swaps 1.5x PNG, OK because we actually fed-in 2x WAVAX
            await PGLPair.connect(trader).swap(amountOut.mul(15).div(10), 0, trader.address, [])
            
            expect(await YakCompounder.balanceOf(trader.address)).to.equal(ethers.BigNumber.from(0))
            await ZapRouter.connect(trader).addLiquidity(
                PNGToken.address,
                WAVAX.address,
                amountIn0, amountIn1,
                amountInMin0, amountInMin1,
                trader.address,
                YakCompounder.address,
                getDeadline()
            )
            expect(await YakCompounder.balanceOf(trader.address)).to.gt(0)
        })

        it('Zap Deposit AVAX PNG into PGL WAVAX-PNG auto-compounder', async () => {
            
            let PNGToken = tkns.PNG
            await helpers.approveERC20(trader, PNGToken.address, ZapRouter.address, ethers.constants.MaxUint256)
            let reservesResponse = await PGLPair.getReserves()
            let reserves0 = reservesResponse.reserve0
            let reserves1 = reservesResponse.reserve1

            let bigOne = parseUnits("1", await PNGToken.decimals());
            let amountIn0 = parseUnits("1", await PNGToken.decimals())
            let amountIn1 = amountIn0.mul(reserves1.mul(bigOne).div(reserves0)).div(bigOne)
            let amountInMin0 = amountIn0.sub(amountIn0.mul(bigOne).mul(5).div(bigOne.mul(1000))) //0.5% slippage
            let amountInMin1 = amountInMin0.mul(reserves1.mul(bigOne).div(reserves0)).div(bigOne) //0.5% slippage
            
            // funds the wallet with 2x WAVAX
            await WAVAX.connect(trader).deposit({ value: amountIn1.mul(2).toString() }) 
            // swaps some WAVAX for PNG to fund the wallet, we don't care if we send more WAVAX
            // than we need PNG here, we just want to be sure we are able to acquire enough PNG
            await WAVAX.connect(trader).transfer(PGLPair.address, amountIn1.mul(2).toString())
            let amountInWithFee = amountIn1.mul(997);
            let numerator = amountInWithFee.mul(reserves0);
            let denominator = reserves1.mul(1000).add(amountInWithFee);
            let amountOut = numerator.div(denominator)
            // swaps 1.5x PNG, OK because we actually fed-in 2x WAVAX
            await PGLPair.connect(trader).swap(amountOut.mul(15).div(10), 0, trader.address, [])
            
            expect(await YakCompounder.balanceOf(trader.address)).to.equal(ethers.BigNumber.from(0))
            await ZapRouter.connect(trader).addLiquidityAVAX(
                PNGToken.address,
                amountIn0, amountInMin0,
                amountInMin1,
                trader.address,
                YakCompounder.address,
                getDeadline(),
                {
                    value: amountIn1.toString(),
                }
            );
            expect(await YakCompounder.balanceOf(trader.address)).to.gt(0)
        })
    })
})
