const { ethers } = require("hardhat")

module.exports.makeAccountGen = async () => {
    function* getNewAccount() {
        let counter = 0
        for (let account of accounts) {
            if (process.argv.includes('--logs')) {
                // Add a tag if tracer is enabled
                hre.tracer.nameTags[account.address] = `Account#${counter}`
            }
            yield account
        }
    }
    accounts = await ethers.getSigners()
    let newAccountGen = getNewAccount()
    let genNewAccount = () => newAccountGen.next().value
    return genNewAccount
}

module.exports.approveERC20 = (signer, token, spender, amount) => {
    return signer.sendTransaction({
        to: token, 
        data: `0x095ea7b3${spender.slice(2).padStart(64, '0')}${amount.toHexString().slice(2).padStart(64, '0')}`
    })
}

module.exports.getERC20Allowance = (provider, token, holder, spender) => {
    return provider.call({
        to: token, 
        data: `0xdd62ed3e${holder.slice(2).padStart(64, '0')}${spender.slice(2).padStart(64, '0')}`
    }).then(ethers.BigNumber.from)
}

module.exports.getERC20Balance = (provider, token, holder) => {
    return provider.call({
        to: token,
        data: `0x70a08231${holder.slice(2).padStart(64, '0')}`
    }).then(ethers.BigNumber.from)
} 

module.exports.topUpAccountWithToken = async (topper, recieverAddress, tokenAddress, amount, routerContract) => {
    let topperBalance = await ethers.provider.getBalance(topper.address)
    const _WAVAX_ = '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7'
    return routerContract.connect(topper).swapAVAXForExactTokens(
        amount, 
        [ _WAVAX_, tokenAddress ], 
        recieverAddress, 
        parseInt(Date.now()/1e3)+3000, 
        { value: topperBalance.div('2') }
    ).then(response => response.wait())
}

module.exports.getTokenContract = tokenAddress => ethers.getContractAt(
    'contracts/interface/IWETH.sol:IWETH', 
    tokenAddress
)

module.exports.getDeadline = () => Math.floor(Date.now() / 1000) + 60 * 20;