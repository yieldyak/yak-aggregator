const {setTestEnv, addresses} = require('../../../utils/test-env')
const {ButtonTokenFactory, PoolsideV1Factory} = addresses.avalanche.other


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
    const adapterArgs = ['PoolsideV1Adapter', PoolsideV1Factory, ButtonTokenFactory, 415_000]
    ate = await testEnv.setAdapterEnv(contractName, adapterArgs)
  })

  beforeEach(async () => {
    testEnv.updateTrader()
  })

  const testConfigs = [
    // WAVAX -> sAVAX direction:
    // zero hops, swap using PoolsideV1
    {tokenIn: 'WAVAX', tokenOut: 'rsAVAX'},
    // zero hops, swap using ButtonWrappers
    {tokenIn: 'rsAVAX', tokenOut: 'SAVAX'},
    // one hop, swap via PoolsideV1 then swap via ButtonWrappers
    {tokenIn: 'WAVAX', tokenOut: 'SAVAX'},

    // sAVAX -> WAVAX direction:
    // zero hops, swap using ButtonWrappers
    {tokenIn: 'SAVAX', tokenOut: 'rsAVAX'},
    // zero hops, swap using PoolsideV1
    {tokenIn: 'rsAVAX', tokenOut: 'WAVAX'},
    // one hop, swap via ButtonWrappers then swap via PoolsideV1
    {tokenIn: 'SAVAX', tokenOut: 'WAVAX'},
  ];

  describe('Query is non-zero for supported pairs', async () => {
    for (const {tokenIn, tokenOut} of testConfigs) {
      it(`${tokenIn} -> ${tokenOut}`, async () => {
        await ate.checkQueryReturnsNonZeroForSupportedTkns(tkns[tokenIn], tkns[tokenOut]);
      });
    }
  })

  describe('Swapping matches query', async () => {
    for (const {tokenIn, tokenOut} of testConfigs) {
      if (tokenIn === 'rsAVAX') {
        // re-enable if a workaround for setERC20Bal not working for rsAVAX is found
        continue;
      }
      it(`${tokenIn} -> ${tokenOut}`, async () => {
        await ate.checkQueryReturnsNonZeroForSupportedTkns(tkns[tokenIn], tkns[tokenOut]);
      });
    }
  })

  it('Query returns zero if tokens not found', async () => {
    const supportedTkn = tkns.WAVAX
    ate.checkQueryReturnsZeroForUnsupportedTkns(supportedTkn)
  })

  describe('Max-gas-used is less than 110% gas-estimate', async () => {
    for (const {tokenIn, tokenOut} of testConfigs) {
      if (tokenIn === 'rsAVAX') {
        // re-enable if a workaround for setERC20Bal not working for rsAVAX is found
        continue;
      }
      it(`${tokenIn} -> ${tokenOut}`, async () => {
        const options = [
          ['1', tkns[tokenIn], tkns[tokenOut]]
        ];
        await ate.checkGasUsedBelowEstimate(options);
      });
    }
  })

})
