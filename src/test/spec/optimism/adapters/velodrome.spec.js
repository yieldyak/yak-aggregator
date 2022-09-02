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
const { velodrome } = addresses.optimism


async function getFixture(forkBlockNumber) {
    await forkGlobalNetwork(forkBlockNumber, 'optimism')
    const [ deployer ] = await ethers.getSigners()
    const args = [ 'VelodromeAdapter', velodrome.factory, 2.8e5 ]
    const VelodromeAdapter = await ethers.getContractFactory('VelodromeAdapter')
        .then(f => f.connect(deployer).deploy(...args))
    return {
        Adapter: VelodromeAdapter,
        deployer
    }
}

describe('YakAdapter - Velodrome', function() {
    

    async function checkAdapterSwapMatchesQuery(
        tokenFrom, 
        tokenTo, 
        amountIn
    ) {
        amountIn = amountIn || parseUnits(
            '1332.2', 
            await tokenFrom.decimals()
        )
        // Querying adapter 
        const amountOutQuery = await Adapter.query(
            amountIn, 
            tokenFrom.address, 
            tokenTo.address
        )
        // Mint tokens to adapter address
        await setERC20Bal(tokenFrom.address, Adapter.address, amountIn)
        // Swapping
        const swap = () => Adapter.connect(trader).swap(
            amountIn, 
            amountOutQuery,
            tokenFrom.address,
            tokenTo.address, 
            trader.address
        )
        // Check that swap matches the query
        await expect(swap).to.changeTokenBalance(
            tokenTo, 
            trader, 
            amountOutQuery
        )
        // Check leftovers arent left in the adapter (less than 10 wei)
        expect(await tokenTo.balanceOf(Adapter.address)).to.lt(parseUnits('10', 18))
    }

    let genNewAccount
    let Adapter
    let trader
    let tkns

    before(async () => {
        const forkBlockNumber = 12932984
        const uniV3fixture = await getFixture(forkBlockNumber)
        Adapter = uniV3fixture.Adapter
        adapterOwner = uniV3fixture.deployer
        tkns = await getSupportedERC20Tokens('optimism')
        genNewAccount = await makeAccountGen()
    })

    beforeEach(async () => {
        trader = genNewAccount()
    })

    describe('swap & query', async () => {

        describe('Swapping matches query', async () => {

            it('DAI -> USDC', async () => {
                await checkAdapterSwapMatchesQuery(tkns.DAI, tkns.USDC, parseUnits('100'))
            })
            it('OP -> USDC', async () => {
                await checkAdapterSwapMatchesQuery(tkns.OP, tkns.USDC, parseUnits('100'))
            })
            it('WETH -> USDC', async () => {
                await checkAdapterSwapMatchesQuery(tkns.WETH, tkns.USDC, parseUnits('1'))
            })
            it('USDC -> DAI', async () => {
                await checkAdapterSwapMatchesQuery(tkns.USDC, tkns.DAI, parseUnits('100', 6))
            })
        })

        it('Query returns zero if tokens not found', async () => {
            const tokenFrom = tkns.USDC
            const tokenTo = ethers.constants.AddressZero
            const amountIn = parseUnits('3232', 8)
            const amountOutQuery = await Adapter.query(
                amountIn, 
                tokenFrom.address, 
                tokenTo
            )
            expect(amountOutQuery).to.eq(0)
        })

        it('Check gas cost', async () => {
            // Options
            const options = [
                [ tkns.USDC, tkns.WETH ],
                [ tkns.OP, tkns.USDC ],
                [ tkns.DAI, tkns.OP ],
            ]
            let maxGas = 0
            for (let [ tokenFrom, tokenTo ] of options) {
                const amountIn = parseUnits('1', await tokenFrom.decimals())
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
                // Swapping
                const swapGas = await Adapter.connect(trader).swap(
                    amountIn, 
                    1,
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
        })
    })

})