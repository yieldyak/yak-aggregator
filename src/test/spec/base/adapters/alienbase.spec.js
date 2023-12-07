const { expect } = require("chai");
const { setTestEnv, addresses } = require("../../../utils/test-env");
const { univ2 } = addresses.base;

describe("YakAdapter - AlienBase", function () {
  let testEnv;
  let tkns;
  let ate; // adapter-test-env

  before(async () => {
    const networkName = "base";
    const forkBlockNumber = 3219755;
    testEnv = await setTestEnv(networkName, forkBlockNumber);
    tkns = testEnv.supportedTkns;

    const contractName = "UniswapV2Adapter";
    const adapterArgs = ["AlienBaseAdapter", univ2.factories.alienbase, 16, 10_000, 160_000];
    ate = await testEnv.setAdapterEnv(contractName, adapterArgs);
  });

  beforeEach(async () => {
    testEnv.updateTrader();
  });

  describe("Swapping matches query", async () => {
    it("10000 USDbC -> axlUSDC", async () => {
      await ate.checkSwapMatchesQuery("10000", tkns.USDbC, tkns.axlUSDC);
    });
  });

  it("Query returns zero if tokens not found", async () => {
    const supportedTkn = tkns.ETH;
    await ate.checkQueryReturnsZeroForUnsupportedTkns(supportedTkn);
  });

  it("Gas-estimate is between max-gas-used and 110% max-gas-used", async () => {
    const options = [["10000", tkns.axlUSDC, tkns.USDbC]];
    await ate.checkGasEstimateIsSensible(options);
  });
});
