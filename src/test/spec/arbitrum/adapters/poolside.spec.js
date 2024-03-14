const {setTestEnv, addresses} = require('../../../utils/test-env')
const {ButtonTokenFactory, PoolsideV1Factory} = addresses.arbitrum.other


describe('YakAdapter - PoolsideV1', () => {

  let testEnv
  let tkns
  let ate // adapter-test-env

  before(async () => {
    const networkName = 'arbitrum'
    const forkBlockNumber = 189980639
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
    // WETH -> cbETH direction:
    // zero hops, swap using PoolsideV1
    {tokenIn: 'WETH', tokenOut: 'rcbETH'},
    // zero hops, swap using ButtonWrappers
    {tokenIn: 'rcbETH', tokenOut: 'cbETH'},
    // one hop, swap via PoolsideV1 then swap via ButtonWrappers
    {tokenIn: 'WETH', tokenOut: 'cbETH'},

    // cbETH -> WETH direction:
    // zero hops, swap using ButtonWrappers
    {tokenIn: 'cbETH', tokenOut: 'rcbETH'},
    // zero hops, swap using PoolsideV1
    {tokenIn: 'rcbETH', tokenOut: 'WETH'},
    // one hop, swap via ButtonWrappers then swap via PoolsideV1
    {tokenIn: 'cbETH', tokenOut: 'WETH'},
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
      if (tokenIn === 'rcbETH') {
        // re-enable if a workaround for setERC20Bal not working for rcbETH is found
        continue;
      }
      it(`${tokenIn} -> ${tokenOut}`, async () => {
        await ate.checkQueryReturnsNonZeroForSupportedTkns(tkns[tokenIn], tkns[tokenOut]);
      });
    }
  })

  it('Query returns zero if tokens not found', async () => {
    const supportedTkn = tkns.WETH
    ate.checkQueryReturnsZeroForUnsupportedTkns(supportedTkn)
  })

  describe('Max-gas-used is less than 110% gas-estimate', async () => {
    for (const {tokenIn, tokenOut} of testConfigs) {
      if (tokenIn === 'rcbETH') {
        // re-enable if a workaround for setERC20Bal not working for rcbETH is found
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
