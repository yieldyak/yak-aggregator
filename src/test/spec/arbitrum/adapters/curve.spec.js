const { expect } = require("chai")
const { ethers } = require("hardhat")
const { parseUnits } = ethers.utils

const { helpers, addresses } = require('../../../fixtures')
const { 
    getSupportedERC20Tokens,
    forkGlobalNetwork, 
    makeAccountGen,
    setERC20Bal, 
} = helpers
const { curve } = addresses.arbitrum


async function deployContract(_contractName, { deployer, args }) {
    return ethers.getContractFactory(_contractName)
        .then(f => f.connect(deployer).deploy(...args))
}

async function setEnv(forkBlockNumber) {
    await forkGlobalNetwork(forkBlockNumber, 'arbitrum')
    const [ deployer ] = await ethers.getSigners()
    const tkns = await getSupportedERC20Tokens('arbitrum')
    const newAccountGen = await makeAccountGen()
    return {
        newAccountGen,
        deployer, 
        tkns
    }
}

describe('YakAdapter - Curve', function() {
    
    function getBpsThresholds(_expectedAmount, _errorBps) {
        const errorBps = parseUnits(_errorBps, 0)
        const denominator = parseUnits('1', 4)
        const low = _expectedAmount.mul(denominator.sub(errorBps)).div(denominator)
        const high = _expectedAmount.mul(denominator.add(errorBps)).div(denominator)
        return [ low, high ]
    }

    async function checkAdapterSwapMatchesQuery(
        tokenFrom, 
        tokenTo, 
        amountInFixed,
        withinBps='0'
    ) {
        amountIn = parseUnits(amountInFixed, await tokenFrom.decimals())
        // Querying adapter 
        const amountOutQuery = await Adapter.query(
            amountIn, 
            tokenFrom.address, 
            tokenTo.address
        )
        // Mint tokens to adapter address
        await setERC20Bal(tokenFrom.address, Adapter.address, amountIn)
        expect(amountOutQuery).to.gt(0)
        // Swapping
        const swap = () => Adapter.connect(trader).swap(
            amountIn, 
            amountOutQuery,
            tokenFrom.address,
            tokenTo.address, 
            trader.address
        )
        // Check that swap matches the query and nothing is left in the adapter
        const adapterBalBefore = await tokenTo.balanceOf(Adapter.address)
        const traderBalBefore = await tokenTo.balanceOf(trader.address)
        await expect(swap()).to.not.reverted
        const adapterBalAfter = await tokenTo.balanceOf(Adapter.address)
        const traderBalAfter = await tokenTo.balanceOf(trader.address)
        expect(adapterBalAfter.sub(adapterBalBefore)).to.lt(10)
        expect(traderBalAfter.sub(traderBalBefore)).to.be.within(
            ...getBpsThresholds(amountOutQuery, withinBps)
        )
    }

    async function checkGasCost(options) {
        let maxGas = 0
        for (let [ tokenFrom, tokenTo, amountIn ] of options) {
            // Mint tokens to adapter address
            await setERC20Bal(tokenFrom.address, Adapter.address, amountIn)
            // Querying
            const queryTx = await Adapter.populateTransaction.query(
                amountIn, 
                tokenFrom.address, 
                tokenTo.address
            )
            const queryGas = await ethers.provider.estimateGas(queryTx)
                .then(parseInt)
            const quote = await Adapter.query(
                amountIn, 
                tokenFrom.address, 
                tokenTo.address
            )
            // Swapping
            const swapGas = await Adapter.connect(trader).swap(
                amountIn, 
                quote,
                tokenFrom.address,
                tokenTo.address, 
                trader.address
            ).then(tr => tr.wait()).then(r => parseInt(r.gasUsed))
            console.log(`swap-gas:${swapGas} | query-gas:${queryGas}`)
            const gasUsed = swapGas + queryGas
            if (gasUsed > maxGas) {
                maxGas = gasUsed
            }
        }
        // Check that gas estimate is above max, but below 10% of max
        const estimatedGas = await Adapter.swapGasEstimate().then(parseInt)
        expect(estimatedGas).to.be.within(maxGas, maxGas * 1.1)
    }

    let genNewAccount
    let adapterOwner
    let Adapter
    let trader
    let tkns

    before(async () => {
        const forkBlockNumber = 16485220
        const _env = await setEnv(forkBlockNumber)
        genNewAccount = _env.newAccountGen
        adapterOwner = _env.deployer
        tkns = _env.tkns
    })

    beforeEach(async () => {
        trader = genNewAccount()
    })

    describe('aTwoStable', async () => {

        before(async () => {
            const adapterArgs = [ 'CurveAtwostable', curve.atwostable, 260_000 ]
            Adapter = await deployContract(
                'CurvePlain128Adapter', 
                { deployer: adapterOwner, args: adapterArgs }
            )
        })

        describe('Swapping matches query', async () => {

            it('USDT -> USDC', async () => {
                await checkAdapterSwapMatchesQuery(tkns.USDT, tkns.USDC, '100')
            })
            it('USDT -> USDC', async () => {
                await checkAdapterSwapMatchesQuery(tkns.USDT, tkns.USDC, '10000')
            })
            it('USDC -> USDT', async () => {
                await checkAdapterSwapMatchesQuery(tkns.USDC, tkns.USDT, '100')
            })
    
        })

        it('Query returns zero if tokens not found', async () => {
            const tokenFrom = tkns.USDC
            const tokenTo = ethers.constants.AddressZero
            const amountIn = parseUnits('1', 6)
            const amountOutQuery = await Adapter.query(
                amountIn, 
                tokenFrom.address, 
                tokenTo
            )
            expect(amountOutQuery).to.eq(0)
        })
    
        it('Gas-estimate is within limits', async () => {
            const options = [
                [ tkns.USDC, tkns.USDT, parseUnits('1', 6) ],
                [ tkns.USDT, tkns.USDC, parseUnits('1', 6) ], 
            ]
            await checkGasCost(options)
        })

    })

    describe('aTriCrypto', async () => {

        before(async () => {
            const adapterArgs = [ 'CurveAtricrypto', curve.atricrypto, 660_000 ]
            Adapter = await deployContract(
                'CurvePlainV2Adapter', 
                { deployer: adapterOwner, args: adapterArgs }
            )
        })

        it('simple query', async () => {
            const tokenFrom = tkns.USDT
            const tokenTo = tkns.WETH
            const amountIn = parseUnits('1', 6)
            const amountOutQuery = await Adapter.query(
                amountIn, 
                tokenFrom.address, 
                tokenTo.address
            )
            expect(amountOutQuery).to.gt(0)            
        })

        describe('Swapping matches query', async () => {

            it('USDT -> WETH', async () => {
                await checkAdapterSwapMatchesQuery(tkns.USDT, tkns.WETH, '2000000')
            })
            it('WETH -> WBTC', async () => {
                await checkAdapterSwapMatchesQuery(tkns.WETH, tkns.WBTC, '1000')
            })
            it('WBTC -> USDT', async () => {
                await checkAdapterSwapMatchesQuery(tkns.WBTC, tkns.USDT, '300')
            })
    
        })

        it('Query returns zero if tokens not found', async () => {
            const tokenFrom = tkns.USDT
            const tokenTo = ethers.constants.AddressZero
            const amountIn = parseUnits('1', 6)
            const amountOutQuery = await Adapter.query(
                amountIn, 
                tokenFrom.address, 
                tokenTo
            )
            expect(amountOutQuery).to.eq(0)
        })
    
        it('Gas-estimate is within limits', async () => {
            const options = [
                [ tkns.USDT, tkns.WBTC, parseUnits('1', 6) ],
                [ tkns.WETH, tkns.USDT, parseUnits('1', 18) ], 
                [ tkns.WBTC, tkns.WETH, parseUnits('1', 8) ], 
            ]
            await checkGasCost(options)
        })

    })

    describe('meta', async () => {

        before(async () => {
            const adapterArgs = [ 
                'CurveMetaAdapter', 
                [ curve.meta_frax, curve.meta_mim ], 
                480_000
            ]
            Adapter = await deployContract(
                'CurveMetaV3Adapter', 
                { deployer: adapterOwner, args: adapterArgs }
            )
        })

        it('simple query', async () => {
            const tokenFrom = tkns.USDC
            const tokenTo = tkns.FRAX
            const amountIn = parseUnits('1', 6)
            const amountOutQuery = await Adapter.query(
                amountIn, 
                tokenFrom.address, 
                tokenTo.address
            )
            expect(amountOutQuery).to.gt(0)            
        })

        describe('Swapping matches query', async () => {

            it('FRAX -> USDT', async () => {
                await checkAdapterSwapMatchesQuery(tkns.FRAX, tkns.USDT, '20000', '3')
            })
            it('USDC -> FRAX', async () => {
                await checkAdapterSwapMatchesQuery(tkns.USDC, tkns.FRAX, '1', '3')
            })
            it('USDC -> MIM', async () => {
                await checkAdapterSwapMatchesQuery(tkns.USDC, tkns.MIM, '2222', '3')
            })
            it('MIM -> USDT', async () => {
                await checkAdapterSwapMatchesQuery(tkns.MIM, tkns.USDT, '333331', '3')
            })
    
        })

        it('Query returns zero if tokens not found', async () => {
            const tokenFrom = tkns.USDT
            const tokenTo = ethers.constants.AddressZero
            const amountIn = parseUnits('1', 6)
            const amountOutQuery = await Adapter.query(
                amountIn, 
                tokenFrom.address, 
                tokenTo
            )
            expect(amountOutQuery).to.eq(0)
        })
    
        it('Gas-estimate is within limits', async () => {
            const options = [
                [ tkns.USDT, tkns.FRAX, parseUnits('1', 6) ],
                [ tkns.USDT, tkns.MIM, parseUnits('1', 6) ], 
                [ tkns.FRAX, tkns.USDC, parseUnits('1', 18) ], 
                [ tkns.MIM, tkns.USDC, parseUnits('1', 18) ], 
            ]
            await checkGasCost(options)
        })

    })

})