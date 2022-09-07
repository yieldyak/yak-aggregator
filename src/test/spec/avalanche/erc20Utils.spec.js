const { expect } = require('chai')
const { 
    setERC20Bal, 
    getAccountsGen, 
    getTknContractsForNetwork
} = require('../../helpers')


describe('ERC20-Utils', async () => {

    const NetworkName = 'avalanche'

    let accountsGen
    let holder
    let tkns

    before(async () => {
        accountsGen = await getAccountsGen()
        tkns = await getTknContractsForNetwork(NetworkName)
    })

    beforeEach(async () => {
        holder = accountsGen.next()
    })

    describe('setERC20Bal', async () => {

        async function checkERC20BalIsSet(token) {
            const getHolderBal = () => token.balanceOf(holder.address)
            const newBal = ethers.utils.parseUnits('1000')
            expect(await getHolderBal()).to.not.eq(newBal)
            await setERC20Bal(token.address, holder.address, newBal)
            expect(await getHolderBal()).to.eq(newBal)
        }

        it('TUSD', async () => {
            await checkERC20BalIsSet(tkns.TUSD)
        })

        it('SNX', async () => {
            await checkERC20BalIsSet(tkns.TUSD)
        })

    })

})