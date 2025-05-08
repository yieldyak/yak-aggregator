const { setTestEnv, addresses } = require("../../../utils/test-env");
const { unilikeFactories } = addresses.avalanche;

describe("YakAdapter - Arena DEX", () => {
  let testEnv;
  let tkns;
  let ate; // adapter-test-env

  before(async () => {
    const networkName = "avalanche";
    const forkBlockNumber = 61603077;
    testEnv = await setTestEnv(networkName, forkBlockNumber);
    tkns = testEnv.supportedTkns;

    const contractName = "UniswapV2Adapter";
    const adapterArgs = ["UniswapV2Adapter", unilikeFactories.arena, 3, 170_000];
    ate = await testEnv.setAdapterEnv(contractName, adapterArgs);
  });

  beforeEach(async () => {
    testEnv.updateTrader();
  });

  describe("Swapping matches query", async () => {
    it("10 ARENA -> WAVAX", async () => {
      await ate.checkSwapMatchesQuery("10", tkns.ARENA, tkns.WAVAX);
    });
  });

  it("Query returns zero if tokens not found", async () => {
    const supportedTkn = tkns.WAVAX;
    ate.checkQueryReturnsZeroForUnsupportedTkns(supportedTkn);
  });

  it("Gas-estimate is between max-gas-used and 110% max-gas-used", async () => {
    const options = [["1", tkns.WAVAX, tkns.ARENA]];
    await ate.checkGasEstimateIsSensible(options);
  });
});
