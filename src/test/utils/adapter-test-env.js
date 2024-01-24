const { expect } = require("chai")
const { ethers } = require("hardhat")

const { setERC20Bal } = require('../helpers')

const DEFAULT_ERROR_BPS = 0

class AdapterTestEnv {
    Adapter
    #env

    constructor(env, _adapter, _deployer) {
        this.#env = env
        this.Adapter = _adapter
        this.deployer = _deployer
        this.trader = () => this.#env.trader
    }

    async checkQueryReturnsZeroForUnsupportedTkns(
        supportedTkn
    ) {
        const amountIn = ethers.parseUnits('1', 6)
        const dummyTkn = ethers.ZeroAddress
        const supportedTknAdd = supportedTkn.target
        await Promise.all([
            this.queryMatches(amountIn, dummyTkn, supportedTknAdd, BigInt(0)),
            this.queryMatches(amountIn, supportedTknAdd, dummyTkn, BigInt(0)),
        ])
    }

    async queryMatches(
        amountIn, 
        tokenFromAdd, 
        tokenToAdd, 
        expectedAmountOut
    ) {
        const amountOutQuery = await this.query(amountIn, tokenFromAdd, tokenToAdd)
        expect(amountOutQuery).to.eq(expectedAmountOut)
    }

    async checkSwapMatchesQuery(
        dxFixed,
        tokenFrom, 
        tokenTo,
    ) {
        await this.checkSwapMatchesQueryWithDustWithErr(
            dxFixed,
            tokenFrom, 
            tokenTo,
            BigInt(0),
            DEFAULT_ERROR_BPS, 
        )
    }

    async checkSwapMatchesQueryWithErr(
        dxFixed,
        tokenFrom, 
        tokenTo,
        errorBps,
    ) {
        await this.checkSwapMatchesQueryWithDustWithErr(
            dxFixed,
            tokenFrom, 
            tokenTo,
            BigInt(0),
            errorBps, 
        )
    }

    async checkSwapMatchesQueryWithDust(
        dxFixed,
        tokenFrom, 
        tokenTo,
        maxDustWei
    ) {
        await this.checkSwapMatchesQueryWithDustWithErr(
            dxFixed,
            tokenFrom, 
            tokenTo,
            maxDustWei,
            DEFAULT_ERROR_BPS, 
        )
    }

    async checkSwapMatchesQueryWithDustWithErr(
        dxFixed,
        tokenFrom, 
        tokenTo,
        maxDustWei,
        errorBps, 
    ) {
        const { swapFn, queryDy } = await this.#getQueryDyAndSwapFn(
            dxFixed,
            tokenFrom, 
            tokenTo,
        )
        expect(queryDy).gt(0)
        const balDiffs = await this.#executeAndReturnBalChange(
            swapFn, 
            tokenTo,
            [ this.trader().address, this.Adapter.target ] 
        )
        const [ traderBalDiff, adapterBalDiff ] = balDiffs
        const errUpperThreshold = getErrUpperThreshold(queryDy, errorBps) + maxDustWei
        expect(traderBalDiff).to.be.within(queryDy, errUpperThreshold)
        expect(adapterBalDiff).to.be.lte(maxDustWei)
    }

    async checkGasEstimateIsSensible(options, accuracyPct=10) {
        let maxGas = 0
        for (let [ amountInFixed, tokenFrom, tokenTo ] of options) {
            const amountIn = await parseUnitsForTkn(amountInFixed, tokenFrom)
            const gasUsed = await this.#getGasEstimateForSwapAndQuery(
                amountIn,
                tokenFrom,
                tokenTo
            )
            if (gasUsed > maxGas) {
                maxGas = gasUsed
            }
        }
        const adapterGasEstimate = await this.Adapter.swapGasEstimate().then(parseInt)
        const upperBoundryPct = 100 + accuracyPct
        expect(adapterGasEstimate).to.be.within(maxGas, maxGas*upperBoundryPct/100)
    }

    // << INTERNAL >>

    async #executeAndReturnBalChange(fn, tknObj, holders) {
        const getBals = () => Promise.all(holders.map(holder => {
            return tknObj.balanceOf(holder)
        }))
        const balBefore = await getBals()
        await fn()
        const balAfter = await getBals()
        const balDiffs = balAfter.map((b0, i) => b0 - balBefore[i])

        return balDiffs
    }

    async #getGasEstimateForSwapAndQuery(amountIn, tokenFrom, tokenTo) {
        const [ gasQuery, gasSwap ] = await Promise.all([
            this.#getGasEstimateForQuery(amountIn, tokenFrom, tokenTo),
            this.#getGasEstimateForSwap(amountIn, tokenFrom, tokenTo)
        ])
        return Number(gasQuery) + gasSwap
    }

    async #getGasEstimateForQuery(amountIn, tokenFrom, tokenTo) {
        return this.Adapter.query.estimateGas(
            amountIn,
            tokenFrom.target, 
            tokenTo.target
        )
    }

    async #getGasEstimateForSwap(amountIn, tokenFrom, tokenTo) {
        const minDy = ethers.parseUnits('1', 'wei')
        const txReceipt = await this.mintAndSwap(
            amountIn,
            minDy,
            tokenFrom, 
            tokenTo
        ).then(tx => tx.wait())
        return parseInt(txReceipt.gasUsed)
    }

    async #getQueryDyAndSwapFn(
        dxFixed,
        tokenFrom, 
        tokenTo,        
    ) {
        const amountIn = await parseUnitsForTkn(dxFixed, tokenFrom)
        const queryDy = await this.query(
            amountIn, 
            tokenFrom.target, 
            tokenTo.target
        )
        const swapFn = async () => this.mintAndSwap(
            amountIn, 
            queryDy,
            tokenFrom,
            tokenTo, 
        )
        return { queryDy, swapFn }
    }

    async query(
        amountIn, 
        tokenFromAdd, 
        tokenToAdd
    ) {
        return this.Adapter.query(
            amountIn, 
            tokenFromAdd, 
            tokenToAdd
        )
    }

    async mintAndSwap(
        amountIn, 
        amountOutQuery, 
        tokenFrom, 
        tokenTo,
        to
    ) {
        await setERC20Bal(tokenFrom.target, this.Adapter.target, amountIn)
        return this.#swap(amountIn, amountOutQuery, tokenFrom, tokenTo, to)
    }

    async #swap(
        amountIn, 
        amountOutQuery, 
        tokenFrom, 
        tokenTo,
        to=this.trader().address
    ) {
        return this.Adapter.connect(this.trader()).swap(
            amountIn, 
            amountOutQuery,
            tokenFrom.target,
            tokenTo.target, 
            to
        )
    }

}

async function parseUnitsForTkn(fixedAmount, token) {
    return ethers.parseUnits(fixedAmount, await token.decimals())
}

function getErrUpperThreshold(expectedAmount, _errorBps) {
    const errorBps = ethers.parseUnits(`${_errorBps}`, 'wei')
    const denominator = ethers.parseUnits('1', 4)
    const high = (expectedAmount * denominator) / (denominator - errorBps)
    return high
}

module.exports = { AdapterTestEnv }