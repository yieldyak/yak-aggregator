const { expect } = require("chai")
const { ethers } = require("hardhat")

const { parseUnits, formatUnits } = ethers.utils
const { ecsign } = require("ethereumjs-util")

describe('Permit', async () => {

    before(async () => {
        [ deployer, alice ] = await ethers.getSigners()
        bob = new ethers.Wallet.createRandom()
        TestToken = await ethers.getContractFactory('TestToken')
            .then(f => f.connect(deployer).deploy())
    })

    it('Offchain permit should match onchain', async () => {
        const permitSpender = alice
        const permitHolder = bob
        const holderPK = bob.privateKey.slice(2)
        const chainId = 43114
        const permitSpendAmount = parseUnits('100')
        const inputTokenContract = TestToken
        // Permit setting
        const PERMIT_TYPEHASH = ethers.utils.keccak256(
            ethers.utils.toUtf8Bytes('Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)')
        )
        const DOMAIN_TYPEHASH = ethers.utils.keccak256(
            ethers.utils.toUtf8Bytes('EIP712Domain(string name,uint256 chainId,address verifyingContract)')
        )
        const domainSeparator = ethers.utils.keccak256(
            ethers.utils.defaultAbiCoder.encode(
              ['bytes32', 'bytes32', 'uint256', 'address'],
              [DOMAIN_TYPEHASH, ethers.utils.keccak256(ethers.utils.toUtf8Bytes(await inputTokenContract.name())), chainId, inputTokenContract.address]
            )
        )
        const nonce = await inputTokenContract.nonces(permitHolder.address)
        const deadline = ethers.constants.MaxUint256
        const digest = ethers.utils.keccak256(
            ethers.utils.solidityPack(
                ['bytes1', 'bytes1', 'bytes32', 'bytes32'],
                [
                '0x19',
                '0x01',
                domainSeparator,
                ethers.utils.keccak256(
                    ethers.utils.defaultAbiCoder.encode(
                    ['bytes32', 'address', 'address', 'uint256', 'uint256', 'uint256'],
                    [PERMIT_TYPEHASH, permitHolder.address, permitSpender.address, permitSpendAmount, nonce, deadline]
                    )
                ),
                ]
            )
        )
        const { v, r, s } = ecsign(Buffer.from(digest.slice(2), 'hex'), Buffer.from(holderPK, 'hex'))
        // Call permit
        await expect(inputTokenContract.permit(
            permitHolder.address, 
            permitSpender.address, 
            permitSpendAmount, 
            deadline,
            v, 
            r, 
            s
        )).to.not.reverted
    })


})