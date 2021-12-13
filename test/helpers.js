const { ethers } = require("hardhat")
const fs = require('fs')

const bigNumToBytes32 = (bn) => {
    return ethers.utils.hexlify(ethers.utils.zeroPad(bn.toHexString(), 32))
};
  
const addressToBytes32 = (add) => {
    return ethers.utils.hexlify(ethers.utils.zeroPad(add, 32))
};

const setStorageAt = async (address, index, value) => {
    await ethers.provider.send("hardhat_setStorageAt", [address, index, value]);
};

const getERC20SlotByExecute = async (token, _signer) => {
    const signer = _signer || (await ethers.getSigners())[0]
    const holder = signer.address
    const tx = await signer.sendTransaction({
        data: `0x70a08231000000000000000000000000${holder.slice(2)}`, 
        gasPrice: ethers.utils.parseUnits('225', 'gwei'),
        to: token, 
    })
    const result = await signer.provider.send('debug_traceTransaction', [tx.hash])
    const [ slot ] = result.structLogs.flatMap(log => {
        // Find SLOAD operations containing the holder address
        const addressMatches = () => '0x'+log.memory[0].replace(/^0+/, '') == holder.toLowerCase()
        if (log.op == 'SLOAD' && addressMatches()) {
            const hash = ethers.utils.keccak256('0x' + log.memory[0] + log.memory[1])
            // Return the slot if its hash with holder address is mapped to return value in storage and hash is on top of stack
            if (log.stack[log.stack.length-1] == hash.slice(2) && log.storage[hash.slice(2)] == result.returnValue) {
                return parseInt(log.memory[1])
            }
        }
        return []
    })
    return slot ?? null
}

const getERC20Slot = async (token, signer) => {
    const cacheTarget = `${process.cwd()}/cache/slots/${token}`
    try {
        const savedSlot = fs.readFileSync(cacheTarget)
        return parseInt(savedSlot.toString())
    } catch (_) {
        const executedSlot = await getERC20SlotByExecute(token, signer)
        if (executedSlot != null) {
            fs.writeFile(cacheTarget, executedSlot.toString(), () => {})
            return executedSlot
        }
        throw new Error(`Could not find ERC20 slot for token ${token}`)
    }
}

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

module.exports.setERC20Bal = async (_token, _holder, _amount) => {
    const storageSlot = await getERC20Slot(_token)
    const key = addressToBytes32(ethers.BigNumber.from(_holder.toString()))
    const index = ethers.utils.keccak256(key + storageSlot.toString().padStart(64, '0'))
    await setStorageAt(_token, index, bigNumToBytes32(_amount))
}