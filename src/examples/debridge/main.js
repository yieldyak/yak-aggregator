require('dotenv').config()
const { ethers, config } = require('hardhat')

const { assets } = require('../../misc/addresses.json').avalanche

const YAK_ROUTER_MAINNET = '0xC4729E56b831d74bBc18797e0e17A295fA77488c'
const PROVIDER = new ethers.providers.JsonRpcProvider(config.networks.avalanche)
const YAK_ROUTER_CONTRACT = new ethers.Contract(
    YAK_ROUTER_MAINNET, 
    require('../../abis/YakRouter.json'), 
    PROVIDER
)

async function query(tknFrom, tknTo, amountIn) {
    const maxHops = 3
    const gasPrice = ethers.utils.parseUnits('225', 'gwei')
    return YAK_ROUTER_CONTRACT.findBestPathWithGas(
        amountIn, 
        tknFrom, 
        tknTo, 
        maxHops,
        gasPrice,
        { gasLimit: 1e9 }
    )
}

async function swap(signer, tknFrom, tknTo, amountIn) {
    const queryRes = await query(tknFrom, tknTo, amountIn)
    const amountOutMin = queryRes.amounts[queryRes.amounts.length-1]
    const fee = 0
    await YAK_ROUTER_CONTRACT.connect(signer).swapNoSplit(
        [
            amountIn, 
            amountOutMin,
            queryRes.path,
            queryRes.adapters
        ],
        signer.address, 
        fee
    ).then(r => r.wait())
     .then(console.log)
}

async function exampleQuery() {
    const amountIn = ethers.utils.parseUnits('1000', 6)
    const tknFrom = assets.deUSDC
    const tknTo = assets.YAK
    const r = await query(tknFrom, tknTo, amountIn)
    console.log(r)
}

async function exampleSwap() {
    const signer = new ethers.Wallet(process.env.PK_TEST, PROVIDER)
    const amountIn = ethers.utils.parseUnits('0.5')
    const tknFrom = assets.WAVAX
    const tknTo = assets.deUSDC
    const r = await swap(signer, tknFrom, tknTo, amountIn)
    console.log(r)
}

exampleQuery()
// exampleSwap()
