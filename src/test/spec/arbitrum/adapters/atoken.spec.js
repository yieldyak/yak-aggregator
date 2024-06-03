const { setTestEnv } = require("../../../utils/test-env");

describe("YakAdapter - atoken", () => {
  let testEnv;
  let tkns;
  let ate; // adapter-test-env

  before(async () => {
    const networkName = "arbitrum";
    const forkBlockNumber = 215498965;
    testEnv = await setTestEnv(networkName, forkBlockNumber);
    tkns = testEnv.supportedTkns;

    const contractName = "AaveAdapter";
    const adapterArgs = [contractName, tkns.aArbUSDCn, 170_000];
    ate = await testEnv.setAdapterEnv(contractName, adapterArgs);
  });

  beforeEach(async () => {
    testEnv.updateTrader();
  });

  describe("Swapping matches query", async () => {
    it("100 USDC -> aArbUSDCn", async () => {
      await ate.checkSwapMatchesQuery("100", tkns.USDC, tkns.aArbUSDCn);
    });
  });

  it("Query returns zero if tokens not found", async () => {
    const supportedTkn = tkns.USDC;
    ate.checkQueryReturnsZeroForUnsupportedTkns(supportedTkn);
  });

  it("Gas-estimate is between max-gas-used and 110% max-gas-used", async () => {
    const options = [["1", tkns.USDC, tkns.aArbUSDCn]];
    await ate.checkGasEstimateIsSensible(options);
  });
});
