const { ecsign } = require('ethereumjs-util')
const { ethers } = require("hardhat")
const { expect } = require("chai")
const { parseUnits } = ethers.utils

const { fixtures, helpers } = require('../../fixtures')

describe('Yak Router - swap', () => {

    let YakRouter
    let adapters
    let assets
    let fix

    before(async () => {
        fix = await fixtures.general()
        const fixRouter = await fixtures.router()
        YakRouter = fixRouter.YakRouter
        adapters = fixRouter.adapters
        assets = fix.assets
    })

    beforeEach(async () => {
        // Start each test with a fresh account
        trader = fix.genNewAccount()
    })
        
    it('Router swap matched the query - multiple hops', async () => {
        // Call the query
        let tokenIn = assets.WAVAX
        let tokenOut = assets.ZDAI
        let steps = 2
        let fee = '0'
        let amountIn = ethers.utils.parseUnits('10')
        let result = await YakRouter.findBestPath(
            amountIn, 
            tokenIn, 
            tokenOut, 
            steps
        )
        // Top up trader with starting tokens
        WAVAX = await ethers.getContractAt('src/contracts/interface/IWETH.sol:IWETH', assets.WAVAX)
        await WAVAX.connect(trader).deposit({ value: amountIn })
        // Approve for input token
        await helpers.approveERC20(trader, result.path[0], YakRouter.address, ethers.constants.MaxUint256)
        // Do the swap
        await YakRouter.connect(trader).swapNoSplit(
            [
                result.amounts[0], 
                result.amounts[result.amounts.length-1],
                result.path,
                result.adapters
            ],
            trader.address, 
            fee
        )
        outputTokenContract = await ethers.getContractAt('contracts/interface/IERC20.sol:IERC20', tokenOut)
        expect(await outputTokenContract.balanceOf(trader.address)).to.equal(
            result.amounts[result.amounts.length-1]
        )
    })

    it('Router swap matched the query - with permit', async () => {
        // Need a real-signer for this test as a permit requires a private key
        let bob = new ethers.Wallet.createRandom().connect(ethers.provider)
        // Top up bob
        await trader.sendTransaction({ to: bob.address, value: parseUnits('2')})
        // Options and constants
        let tokenIn = assets.PNG
        let tokenOut = assets.WAVAX
        let steps = 2
        let fee = '0'
        let amountIn = ethers.utils.parseUnits('1000')
        const chainId = 43114
        // Permit setting
        let inputTokenContract = await ethers.getContractAt('contracts/interface/IERC20.sol:IERC20', tokenIn)
        const PERMIT_TYPEHASH = ethers.utils.keccak256(
            ethers.utils.toUtf8Bytes('Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)')
        )
        const DOMAIN_TYPEHASH = ethers.utils.keccak256(
            ethers.utils.toUtf8Bytes('EIP712Domain(string name,uint256 chainId,address verifyingContract)')
        )
        const domainSeparator = ethers.utils.keccak256(
            ethers.utils.defaultAbiCoder.encode(
                [ 'bytes32', 'bytes32', 'uint256', 'address' ],
                [
                    DOMAIN_TYPEHASH, 
                    ethers.utils.keccak256(
                        ethers.utils.toUtf8Bytes(await inputTokenContract.name())
                    ), 
                    chainId, 
                    inputTokenContract.address
                ]
            )
        )
        const nonce = await inputTokenContract.nonces(bob.address)
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
                    [
                        PERMIT_TYPEHASH, 
                        bob.address, 
                        YakRouter.address, 
                        amountIn, 
                        nonce, 
                        deadline
                    ]
                    )
                ),
                ]
            )
        )
        const { v, r, s } = ecsign(Buffer.from(digest.slice(2), 'hex'), Buffer.from(bob.privateKey.slice(2), 'hex'))
        // Top up trader with starting tokens
        await helpers.topUpAccountWithToken(
            trader, 
            bob.address,
            tokenIn, 
            amountIn, 
            fix.PangolinRouter
        )
        // Call the query
        let result = await YakRouter.findBestPath(
            amountIn, 
            tokenIn, 
            tokenOut,
            steps
        )
        // Do the swap with permit
        await YakRouter.connect(bob).swapNoSplitWithPermit(
            [
                result.amounts[0], 
                result.amounts[result.amounts.length-1],
                result.path,
                result.adapters
            ],  
            bob.address, 
            fee, 
            deadline, 
            v, 
            r, 
            s 
        )
        // Verify executed met expected
        outputTokenContract = await ethers.getContractAt('contracts/interface/IERC20.sol:IERC20', tokenOut)
        expect(await outputTokenContract.balanceOf(bob.address)).to.equal(
            result.amounts[result.amounts.length-1]
        )
    })

    it('Mix swap can be done to AVAX', async () => {
        // Call the query
        let tokenIn = assets.PNG
        let tokenOut = assets.WAVAX
        let steps = 2
        let fee = '0'
        let amountIn = ethers.utils.parseUnits('10')

        // Top up trader with starting tokens
        WAVAX = await ethers.getContractAt('src/contracts/interface/IWETH.sol:IWETH', assets.WAVAX)
        await WAVAX.connect(trader).deposit({ value: amountIn })
        await helpers.topUpAccountWithToken(
            trader, 
            trader.address,
            tokenIn, 
            amountIn, 
            fix.PangolinRouter
        )
        // Query trade
        let result = await YakRouter.findBestPath(
            amountIn, 
            tokenIn, 
            tokenOut,
            steps
        )
        // Approve for input token
        await helpers.approveERC20(trader, tokenIn, YakRouter.address, ethers.constants.MaxUint256)
        // Do the swap
        const swap = YakRouter.connect(trader).swapNoSplitToAVAX(
            [
                result.amounts[0], 
                result.amounts[result.amounts.length-1],
                result.path,
                result.adapters
            ],
            trader.address, 
            fee
        )
        await expect(await swap).to.changeEtherBalance(trader, result.amounts[result.amounts.length-1])
    })

    it('Mix swap can be done from AVAX', async () => {
        // Call the query
        let tokenIn = assets.WAVAX
        let tokenOut = assets.PNG
        let steps = 2
        let fee = '0'
        let amountIn = ethers.utils.parseUnits('10')

        // Query trade
        let result = await YakRouter.findBestPath(
            amountIn, 
            tokenIn, 
            tokenOut, 
            steps
        )
        // Do the swap
        await YakRouter.connect(trader).swapNoSplitFromAVAX(
            [
                result.amounts[0], 
                result.amounts[result.amounts.length-1],
                result.path,
                result.adapters
            ], 
            trader.address, 
            fee, 
            { value: amountIn }
        )
        // Check the balance after
        let tokenOutBal = await helpers.getERC20Balance(ethers.provider, tokenOut, trader.address)
        expect(tokenOutBal).to.equal(
            result.amounts[result.amounts.length-1]
        )
    })

    it('User gets expected out-amount if conditions dont change', async () => {
        // Call the query
        let tokenIn = assets.WAVAX
        let tokenOut = assets.PNG
        let steps = 2
        let fee = '0'
        let amountIn = ethers.utils.parseUnits('10')

        // Query trade
        let result = await YakRouter.findBestPath(
            amountIn, 
            tokenIn, 
            tokenOut, 
            steps
        )
        // Do the swap
        await YakRouter.connect(trader).swapNoSplitFromAVAX(
            [
                result.amounts[0], 
                result.amounts[result.amounts.length-1],
                result.path,
                result.adapters
            ], 
            trader.address, 
            fee,
            { value: amountIn }
        )
        // Check the balance after
        let tokenOutBal = await helpers.getERC20Balance(ethers.provider, tokenOut, trader.address)
        expect(tokenOutBal).to.equal(
            result.amounts[result.amounts.length-1]
        )
    })

    it('Transactions reverts if expected out-amount is not within slippage', async () => {
        // Call the query
        let tokenIn = fix.tokenContracts.WAVAX
        let tokenOut = fix.tokenContracts.ETH
        let amountIn = parseUnits('2000')
        let steps = 2
        let fee = '0'
        
        // Query trade
        let result = await YakRouter.findBestPath(
            amountIn, 
            tokenIn.address, 
            tokenOut.address, 
            steps
        )
        let tradeAdapters = Object.values(adapters).filter(adapter => {
            return result.adapters.includes(adapter.address)
        })

        // Conditions change negatively (trade in between in the same direction)
        // (Use first adapter from the query to do the trade)
        let externalTrader = fix.genNewAccount()
        let firstAdapter = tradeAdapters[0]
        let amountInChange = parseUnits('2000')
        let traderTknBal1 = await tokenOut.balanceOf(externalTrader.address)
        await tokenIn.connect(externalTrader).deposit({value: amountInChange})
        await tokenIn.connect(externalTrader).transfer(firstAdapter.address, amountInChange)
        const amountOut = await firstAdapter.query(amountInChange, tokenIn.address, tokenOut.address)
        await firstAdapter.connect(externalTrader).swap(
            amountInChange,
            amountOut,
            tokenIn.address,
            tokenOut.address, 
            externalTrader.address
        )
        let traderTknBal2 = await tokenOut.balanceOf(externalTrader.address)
        expect(traderTknBal2).to.gt(traderTknBal1)
        // Do the swap
        await expect(YakRouter.connect(trader).swapNoSplitFromAVAX(
            [
                result.amounts[0], 
                result.amounts[result.amounts.length-1],
                result.path,
                result.adapters
            ], 
            trader.address, 
            fee, 
            { value: amountIn }
        )).to.reverted
    })

    it('User gets expected out-amount+positiveSlippage if conditions change positively', async () => {
        // Call the query
        let tokenIn = fix.tokenContracts.WAVAX
        let tokenOut = fix.tokenContracts.DAI
        let amountIn = parseUnits('500')
        let steps = 1
        let fee = '0'

        // Top up the account that will swap between query and swap (otherwise the top up can affect the test)
        let externalTrader = fix.genNewAccount()
        let amountInChange = parseUnits('10')
        let tokenInChange = tokenOut
        let tokenOutChange = tokenIn
        
        await helpers.topUpAccountWithToken(
            externalTrader, 
            externalTrader.address,
            tokenInChange.address, 
            amountInChange, 
            fix.PangolinRouter
        )
        // Query trade
        let result = await YakRouter.findBestPath(
            amountIn, 
            tokenIn.address, 
            tokenOut.address, 
            steps
        )
        // Conditions change positively (trade in between in the opposite direction)
        // Expect only one adapter for one step
        let firstAdapter = Object.values(adapters).find(a => a.address==result.adapters[0])
        let changeTknBal1 = await tokenOutChange.balanceOf(externalTrader.address)
        await tokenInChange.connect(externalTrader).transfer(firstAdapter.address, amountInChange)
        const amountOut = await firstAdapter.query(amountInChange, tokenInChange.address, tokenOutChange.address)
        await firstAdapter.connect(externalTrader).swap(
            amountInChange,
            amountOut,
            tokenInChange.address,
            tokenOutChange.address, 
            externalTrader.address
        )            
        let changeTknBal2 = await tokenOutChange.balanceOf(externalTrader.address)
        expect(changeTknBal2).to.gt(changeTknBal1)
        // Do the swap
        await YakRouter.connect(trader).swapNoSplitFromAVAX(
            [
                result.amounts[0], 
                result.amounts[result.amounts.length-1],
                result.path,
                result.adapters
            ],
            trader.address, 
            fee,
            { value: amountIn }
        )
        // Check the balance after
        let tokenOutBal = await tokenOut.balanceOf(trader.address)
        // Expect that user collects positive slippage
        expect(tokenOutBal).to.gt(
            result.amounts[result.amounts.length-1]
        )
    })

    it('User gets expected out-amount within slippage if conditions change negatively', async () => {
        // Call the query
        let tokenIn = fix.tokenContracts.WAVAX
        let tokenOut = fix.tokenContracts.DAIe
        let slippageDenominator = parseUnits('1', 5)
        let slippage = parseUnits('0.01', 5)
        let amountIn = parseUnits('10')
        let steps = 2
        let fee = '0'

        // Query trade
        let result = await YakRouter.findBestPath(
            amountIn, 
            tokenIn.address, 
            tokenOut.address, 
            steps
        )
        let tradeAdapters = result.adapters.map(rAdapter => {
            return Object.values(adapters).find(a => a.address==rAdapter)
        })
        // Conditions change negatively (trade in between in the same direction)
        // (Use first adapter from the query to do the trade)
        let externalTrader = fix.genNewAccount()
        let firstAdapter = tradeAdapters[0]
        let amountInChange = parseUnits('1')
        let tokenInChange = tokenIn
        let tokenOutChange = await helpers.getTokenContract(result.path[1])

        let changeTknBal1 = await tokenOutChange.balanceOf(externalTrader.address)
        await tokenInChange.connect(externalTrader).deposit({ value: amountInChange })
        await tokenInChange.connect(externalTrader).transfer(firstAdapter.address, amountInChange)
        const amountOut = await firstAdapter.query(amountInChange, tokenInChange.address, tokenOutChange.address)
        await firstAdapter.connect(externalTrader).swap(
            amountInChange,
            amountOut,
            tokenInChange.address,
            tokenOutChange.address, 
            externalTrader.address
        )            
        let changeTknBal2 = await tokenOutChange.balanceOf(externalTrader.address)
        expect(changeTknBal2).to.gt(changeTknBal1)
        // Do the swap
        const minAmountOut = result.amounts[result.amounts.length-1].mul(slippageDenominator.sub(slippage)).div(slippageDenominator)
        await YakRouter.connect(trader).swapNoSplitFromAVAX(
            [
                result.amounts[0], 
                minAmountOut,
                result.path,
                result.adapters
            ], 
            trader.address, 
            fee,
            { value: amountIn }
        )
        // Check the balance after
        let traderTknBal3 = await tokenOut.balanceOf(trader.address)
        expect(traderTknBal3).to.gt(
            minAmountOut
        )
    })

    it('Swap with 3-4 steps', async () => {
        // Options
        let tokenIn = assets.ZUSDT
        let tokenOut = assets.TUSD
        let steps = 4
        let fee = '0'
        let amountIn = ethers.utils.parseUnits('10', 6)

        // Top up trader with starting tokens
        let [ topUpAmountIn ] = await fix.ZeroRouter.getAmountsIn(amountIn, [assets.WAVAX, assets.ZERO, assets.ZUSDT])
        await fix.ZeroRouter.connect(trader).swapETHForExactTokens(
            amountIn, 
            [assets.WAVAX, assets.ZERO, assets.ZUSDT], 
            trader.address, 
            parseInt(Date.now()/1e3)+3000, 
            { value: topUpAmountIn }
        ).then(response => response.wait())

        // Query trade
        let result = await YakRouter.findBestPath(
            amountIn, 
            tokenIn, 
            tokenOut, 
            steps
        )
        expect(result.adapters.length).to.gte(3)
        // Approve for input token
        await helpers.approveERC20(trader, tokenIn, YakRouter.address, ethers.constants.MaxUint256)
        // Do the swap
        const swap = () => YakRouter.connect(trader).swapNoSplit(
            [
                result.amounts[0], 
                result.amounts[result.amounts.length-1],
                result.path,
                result.adapters
            ],
            trader.address, 
            fee
        )
        const tokenOutContract = await ethers.getContractAt('contracts/interface/IERC20.sol:IERC20', tokenOut)
        const expectedOutAmount = result.amounts[result.amounts.length-1]
        await expect(swap).to.changeTokenBalance(
            tokenOutContract, trader, expectedOutAmount
        )
    })

    it('Optional fee goes to the claimer', async () => {
        const _amountIn = parseUnits('10')
        const _amountOut = '0'
        const _fee = parseUnits('0.03', 4)
        const _feeDenominator = parseUnits('1', 4)
        const _path = [
            fix.tokenContracts.WAVAX, 
            fix.tokenContracts.PNG
        ]
        const _adapters = [ adapters.PangolinAdapter.address ]
        const feeClaimer = await YakRouter.FEE_CLAIMER()
        await YakRouter.connect(trader).swapNoSplitFromAVAX(
            [
                _amountIn, 
                _amountOut,
                _path.map(t=>t.address),
                _adapters
            ],
            trader.address, 
            _fee,
            { value: _amountIn }
        )
        const claimerBalAfter = await _path[0].balanceOf(feeClaimer)
        const expectedFeeAmount = _amountIn.mul(_fee).div(_feeDenominator)
        expect(claimerBalAfter).to.equal(expectedFeeAmount)
    })

})