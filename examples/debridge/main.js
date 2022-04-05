require('dotenv').config()
const { ethers } = require('ethers')

const { assets } = require('../../test/addresses.json')

const YAK_ROUTER_MAINNET = '0xC4729E56b831d74bBc18797e0e17A295fA77488c'
const PROVIDER = new ethers.providers.JsonRpcProvider(
    process.env.AVALANCHE_MAINNET_RPC
)
const YAK_ROUTER_CONTRACT = new ethers.Contract(
    YAK_ROUTER_MAINNET, 
    require('./yakrouter.abi.json'), 
    PROVIDER
)

async function query(tknFrom, tknTo, amountIn) {
    const steps = 3 // Number of hops between markets swap is able to take
    const gasPrice = ethers.utils.parseUnits('225', 'gwei')
    return YAK_ROUTER_CONTRACT.findBestPathWithGas(
        amountIn, 
        tknFrom, 
        tknTo, 
        steps,
        gasPrice,
        { gasLimit: 1e9 }
    )
}

async function swap(signer, tknFrom, tknTo, amountIn) {
    const queryRes = await query(tknFrom, tknTo, amountIn)
    const amountOutMin = queryRes.amounts[queryRes.amounts.length-1]
    await YAK_ROUTER_CONTRACT.connect(signer).swapNoSplit(
        [
            amountIn, 
            amountOutMin,
            queryRes.path,
            queryRes.adapters
        ],
        signer.address, 
        0  // Fee %
    ).then(r => r.wait())
     .then(console.log)
}

async function testQuery() {
    const amountIn = ethers.utils.parseUnits('1000', 6)
    const tknFrom = assets.deUSDC
    const tknTo = assets.YAK
    const r = await query(tknFrom, tknTo, amountIn)
    console.log(r)
}

async function testSwap() {
    const signer = new ethers.Wallet(process.env.PK_TEST, PROVIDER)
    const amountIn = ethers.utils.parseUnits('0.5')
    const tknFrom = assets.WAVAX
    const tknTo = assets.deUSDC
    const r = await swap(signer, tknFrom, tknTo, amountIn)
    console.log(r)
}

// testQuery()
testSwap()