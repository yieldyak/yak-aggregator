const { expect } = require("chai")
const { ethers } = require("hardhat")
const fixtures = require('../../fixtures')
const { parseUnits } = ethers.utils
const { assets } = require('../../addresses.json')

describe('Yak Router - general', () => {

    let fix

    before(async () => {
        fix = await fixtures.general()
        const fixRouter = await fixtures.router()
        YakRouterFactory = fixRouter.YakRouterFactory
        YakRouter = fixRouter.YakRouter
        adapters = fixRouter.adapters
        ZeroRouter = fix.ZeroRouter
        PangolinRouter = fix.PangolinRouter
        tkns = fix.tokenContracts
        owner = fix.deployer
    })

    beforeEach(async () => {
        // Start each test with a fresh account
        trader = fix.genNewAccount()
    })

    it('Set tokens', async () => {
        let newTrustedTokens = [
            "0xbA7dEebBFC5fA1100Fb055a87773e1E99Cd3507a", 
            "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7", 
            "0x60781C2586D68229fde47564546784ab3fACA982", 
            "0xde3A24028580884448a5397872046a019649b084",
            "0xf20d962a6c8f70c731bd838a3a388D7d48fA6e15", 
            "0x1C20E891Bab6b1727d14Da358FAe2984Ed9B59EB", 
        ]
        let _YakRouter = await YakRouterFactory.connect(owner).deploy([], [], owner.address, assets.WAVAX)

        // Not trusted tokens at the beginning
        expect(await _YakRouter.trustedTokensCount()).to.equal('0')

        // Tokens should be added to an empty array
        await _YakRouter.connect(owner).setTrustedTokens(newTrustedTokens)
        let newTokenCount = await _YakRouter.trustedTokensCount().then(r=>r.toNumber())
        expect(newTokenCount).to.equal(newTrustedTokens.length)
        let writtenTrustedTokens = await Promise.all(
            [...Array(newTokenCount).keys()].map(i => {
                return _YakRouter.TRUSTED_TOKENS(i)
            })
        )
        expect(writtenTrustedTokens).deep.to.equal(newTrustedTokens)
    })
    
})
