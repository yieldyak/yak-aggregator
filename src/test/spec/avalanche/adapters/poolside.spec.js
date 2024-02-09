const { setTestEnv, addresses } = require('../../../utils/test-env')
const { PoolsideV1Factory } = addresses.avalanche.other


describe('YakAdapter - PoolsideV1', () => {

  let testEnv
  let tkns
  let ate // adapter-test-env

  before(async () => {
    const networkName = 'avalanche'
    const forkBlockNumber = 41335630
    testEnv = await setTestEnv(networkName, forkBlockNumber)
    tkns = testEnv.supportedTkns

    const contractName = 'PoolsideV1Adapter'
    const adapterArgs = [ 'PoolsideV1Adapter', PoolsideV1Factory, 279_220 ]
    ate = await testEnv.setAdapterEnv(contractName, adapterArgs)
  })

  beforeEach(async () => {
    testEnv.updateTrader()
  })

  describe('Swapping matches query', async () => {
    it('1 WAVAX -> rsAVAX', async () => {
      await ate.checkSwapMatchesQuery('1', tkns.WAVAX, tkns.rsAVAX)
    })
    // re-enable if a workaround for setERC20Bal not working for rsAVAX is found
    // it('1 rsAVAX -> WAVAX', async () => {
    //   await ate.checkSwapMatchesQuery('1', tkns.rsAVAX, tkns.WAVAX)
    // })
  })

  it('Query returns zero if tokens not found', async () => {
    const supportedTkn = tkns.WAVAX
    ate.checkQueryReturnsZeroForUnsupportedTkns(supportedTkn)
  })

  it('Gas-estimate is between max-gas-used and 110% max-gas-used', async () => {
    const options = [
      [ '1', tkns.WAVAX, tkns.rsAVAX ],
      // re-enable if a workaround for setERC20Bal not working for rsAVAX is found
      // [ '1', tkns.rsAVAX, tkns.WAVAX ],
    ]
    await ate.checkGasEstimateIsSensible(options)
  })

})
