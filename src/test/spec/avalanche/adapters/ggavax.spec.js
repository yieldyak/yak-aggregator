const { setTestEnv } = require("../../../utils/test-env");

describe("YakAdapter - savax", () => {
  let testEnv;
  let tkns;
  let ate; // adapter-test-env

  before(async () => {
    const networkName = "avalanche";
    const forkBlockNumber = 47577367;
    testEnv = await setTestEnv(networkName, forkBlockNumber);
    tkns = testEnv.supportedTkns;

    const contractName = "GGAvaxAdapter";
    const adapterArgs = [170_000];
    ate = await testEnv.setAdapterEnv(contractName, adapterArgs);
  });

  beforeEach(async () => {
    testEnv.updateTrader();
  });

  describe("Swapping matches query", async () => {
    it("100 WAVAX -> ggAVAX", async () => {
      await ate.checkSwapMatchesQuery("1", tkns.WAVAX, tkns.ggAVAX);
    });
    it("100 ggAVAX -> WAVAX", async () => {
      await ate.checkSwapMatchesQuery("1", tkns.ggAVAX, tkns.WAVAX);
    });
  });

  it("Query returns zero if tokens not found", async () => {
    const supportedTkn = tkns.WAVAX;
    ate.checkQueryReturnsZeroForUnsupportedTkns(supportedTkn);
  });

  it("Gas-estimate is between max-gas-used and 110% max-gas-used", async () => {
    const options = [["1", tkns.WAVAX, tkns.ggAVAX]];
    await ate.checkGasEstimateIsSensible(options);
  });
});
