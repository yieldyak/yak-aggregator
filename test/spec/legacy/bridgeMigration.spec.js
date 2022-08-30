const { expect } = require("chai")
const { ethers } = require("hardhat")
const fixtures = require('../../fixtures')
const helpers = require('../../helpers')
const { parseUnits } = ethers.utils


describe.skip("YakAdapter BridgeMigration", function() {

    let BMAdapterFactory
    let genNewAccount
    let bridgeTokens
    let oldTokens
    let BMAdapter
    
    before(async () => {
        const fixBM = await fixtures.bridgeMigration()
        BMAdapter = fixBM.adapter
        BMAdapterFactory = fixBM.adapterFactory
        bridgeTokens = fixBM.bridgeTokens
        oldTokens = fixBM.oldTokens
        genNewAccount = await helpers.makeAccountGen()
    })

    beforeEach(async () => {
        // Start each test with a fresh account
        trader = genNewAccount()
    })

    describe('query', async () => {
        it('Return 0 for 0', async () => {
            const amountIn = parseUnits('0')
            const tokenIn = oldTokens[0]
            const tokenOut = bridgeTokens[0]
            expect(await BMAdapter.query(amountIn, tokenIn.address, tokenOut.address))
                .to.equal('0')
        })
        it('Return 0 for unknown bridge token', async () => {
            const amountIn = parseUnits('20')
            const tokenIn = oldTokens[0]
            const tokenOut = oldTokens[1]  // Not a bridge token
            expect(await BMAdapter.query(amountIn, tokenIn.address, tokenOut.address))
                .to.equal('0')
        })
        it('Return 0 for wrong source token', async () => {
            const amountIn = parseUnits('20')
            const tokenIn = oldTokens[0]
            const tokenOut = bridgeTokens[1]
            expect(await BMAdapter.query(amountIn, tokenIn.address, tokenOut.address))
                .to.equal('0')
        })
        it('Valid swap returns input amount', async () => {
            const amountIn = parseUnits('20')
            const tokenIn = oldTokens[0]
            const tokenOut = bridgeTokens[0]
            expect(await BMAdapter.query(amountIn, tokenIn.address, tokenOut.address))
                .to.equal(amountIn)
        })
    })

    describe('setTokens', async () => {
        it('Revert if src and dest tokens dont match', async () => {
            const _oldTokens = [ oldTokens[0].address ]
            const _bridgeTokens = [ bridgeTokens[1].address ]
            await expect(BMAdapterFactory.deploy(_bridgeTokens, _oldTokens, 9e4))
                .to.revertedWith('BridgeMigrationAdapter: Invalid combination')
        })
        it('Approve when tokens are set and allowance is not max', async () => {
            const _oldTokens = [ oldTokens[0].address ]
            const _bridgeTokens = [ bridgeTokens[0].address ]
            const _adapter = await BMAdapterFactory.deploy(_bridgeTokens, _oldTokens, 9e4)
            expect(await oldTokens[0].allowance(_adapter.address, bridgeTokens[0].address))
                .to.equal(ethers.constants.MaxUint256)
            expect(await _adapter.isNewBridgeToken(_bridgeTokens[0]))
        })
    })

    describe('swap', async () => {
        it('Successful swap', async () => {
            const inputAmount = parseUnits('1')
            const tokenIn = oldTokens[0]
            const tokenOut = bridgeTokens[0]
            const swap = () => BMAdapter.connect(trader).swap(
                inputAmount, 
                inputAmount, 
                tokenIn.address, 
                tokenOut.address, 
                trader.address
            ) 
            await expect(swap).to.changeTokenBalance(tokenOut, trader, inputAmount)
        })
    })
    
})