const { ethers, config } = require("hardhat")
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
    let depthToAddress = { 1: token }
    const bytes32ToAddress = x => '0x' + x.replace(/^0+/, '')
    const r = result.structLogs.flatMap(log => {
        // Find SLOAD operations containing the holder address
        const addressMatches = () => bytes32ToAddress(log.memory[0]) == holder.toLowerCase()
        if (log.op == 'SLOAD' && addressMatches()) {
            const hash = ethers.utils.keccak256('0x' + log.memory[0] + log.memory[1])
            const shash = hash.slice(2)
            // Return the slot if its hash with holder address is mapped to return value in storage and hash is on top of stack
            if (log.stack[log.stack.length-1] == shash && log.storage[shash] == result.returnValue) {
                const slot = parseInt(log.memory[1], 16)
                const contract = depthToAddress[log.depth]
                return [contract, slot]
            }
        } else if (log.op == 'STATICCALL') {
            depthToAddress[log.depth + 1] = bytes32ToAddress(log.stack[4])
        } else if (log.op == 'DELEGATECALL') {
            depthToAddress[log.depth + 1] = depthToAddress[log.depth]
        }
        return []
    })
    return r ?? null
}

const getERC20Slot = async (token, signer) => {
    const cacheTarget = `${process.cwd()}/cache/slots/${token}`
    try {
        const cached = fs.readFileSync(cacheTarget)
        const [ contract, slot ] = cached.split('::')
        return [contract, parseInt(slot)]
    } catch (_) {
        const res = await getERC20SlotByExecute(token, signer)
        if (res != null) {
            const [contract, slot] = res
            const cache = `${contract}::${slot}`
            fs.writeFile(cacheTarget, cache, () => {})
            return res
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

module.exports.getAccountsGen = async () => {
    const accounts = await ethers.getSigners()

    function* makeGen() {
        for (let account of accounts)
            yield account
    }

    const gen = makeGen()
    return { next: () => gen.next().value }

    
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

module.exports.getERC20Decimals = (provider, token) => {
    return provider.call({ to: token, data: '0x313ce567' })
        .then(d => parseInt(d, 16))
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

const _getTokenContract = tokenAddress => ethers.getContractAt(
    'src/contracts/interface/IERC20.sol:IERC20', 
    tokenAddress
)

module.exports.getTokenContract = _getTokenContract

module.exports.setERC20Bal = async (_token, _holder, _amount) => {
    const [contract, storageSlot] = await getERC20Slot(_token)
    const key = addressToBytes32(_holder)
    const index = ethers.utils.keccak256(
        key + storageSlot.toString(16).padStart(64, '0')
    ).replace(/0x0+/, "0x")  // Hardhat doesn't like leading zeroes
    await setStorageAt(contract, index, bigNumToBytes32(_amount))
}

module.exports.impersonateAccount = async (account) => {
    return hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [account]}
    )
}

module.exports.injectFunds = async (sender, reciever, amount) => {
    await ethers.getContractFactory('NTInjector')
        .then(f => f.connect(sender).deploy(reciever, {value: amount}))
}

const _setHardhatNetwork = async ({forkBlockNumber, chainId, rpcUrl}) => { 
    return network.provider.request({
        method: "hardhat_reset",
        params: [
          {
            chainId: chainId,
            forking: {
              blockNumber: forkBlockNumber,
              jsonRpcUrl: rpcUrl,
            },
          },
        ],
      });
}

module.exports.setHardhatNetwork = _setHardhatNetwork

module.exports.forkGlobalNetwork = async (_blockNumber, _networkId) => {
    const networkConfig = config.networks[_networkId]
    if (!networkConfig)
        throw new Error(`Network-ID "${_networkId}" not recognized`)
    _setHardhatNetwork({
        forkBlockNumber: _blockNumber, 
        rpcUrl: networkConfig.url,
        chainId: networkConfig.chainId
    })
}

module.exports.getTknContractsForNetwork = async (networkName) => {
    const { assets } = require('../misc/addresses.json')[networkName]
    return Promise.all(Object.keys(assets).map(tknSymbol => {
        return _getTokenContract(assets[tknSymbol]).then(tc => [tknSymbol, tc])
    })).then(Object.fromEntries)
}

module.exports.deployContract = async (_contractName, { deployer, args }) => {
    return ethers.getContractFactory(_contractName)
        .then(f => f.connect(deployer).deploy(...args))
}