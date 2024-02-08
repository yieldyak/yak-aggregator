const { setTestEnv, addresses } = require('../../../utils/test-env')
const { ButtonTokenFactory } = addresses.avalanche.other


describe('YakAdapter - ButtonWrappers', () => {

  let testEnv
  let tkns
  let ate // adapter-test-env

  before(async () => {
    const networkName = 'avalanche'
    const forkBlockNumber = 41335630
    testEnv = await setTestEnv(networkName, forkBlockNumber)
    tkns = testEnv.supportedTkns

    const contractName = 'ButtonWrappersAdapter'
    const adapterArgs = [ 'ButtonWrappersAdapter', ButtonTokenFactory, 10 ]
    ate = await testEnv.setAdapterEnv(contractName, adapterArgs)
  })

  beforeEach(async () => {
    testEnv.updateTrader()
  })

  describe('Swapping matches query', async () => {
    it('1 SAVAX -> rsAVAX', async () => {
      await ate.checkSwapMatchesQuery('1', tkns.SAVAX, tkns.rsAVAX)
    })
    it('1 rsAVAX -> SAVAX', async () => {
      await ate.checkSwapMatchesQuery('1', tkns.rsAVAX, tkns.SAVAX)
    })
  })

  it('Query returns zero if tokens not found', async () => {
    const supportedTkn = tkns.SAVAX
    ate.checkQueryReturnsZeroForUnsupportedTkns(supportedTkn)
  })

  it('Gas-estimate is between max-gas-used and 110% max-gas-used', async () => {
    const options = [
      [ '1', tkns.SAVAX, tkns.rsAVAX ],
      [ '1', tkns.rsAVAX , tkns.SAVAX],
    ]
    await ate.checkGasEstimateIsSensible(options)
  })

})
