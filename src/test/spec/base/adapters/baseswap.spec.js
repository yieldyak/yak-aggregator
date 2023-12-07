const { expect } = require("chai");
const { setTestEnv, addresses } = require("../../../utils/test-env");
const { univ2 } = addresses.base;

describe("YakAdapter - Baseswap", function () {
  let testEnv;
  let tkns;
  let ate; // adapter-test-env

  before(async () => {
    const networkName = "base";
    const forkBlockNumber = 3219755;
    testEnv = await setTestEnv(networkName, forkBlockNumber);
    tkns = testEnv.supportedTkns;

    const contractName = "UniswapV2Adapter";
    const adapterArgs = ["BaseswapAdapter", univ2.factories.baseswap, 25, 10_000, 150_000];
    ate = await testEnv.setAdapterEnv(contractName, adapterArgs);
  });

  beforeEach(async () => {
    testEnv.updateTrader();
  });

  describe("Swapping matches query", async () => {
    it("1 ETH -> axlUSDC", async () => {
      await ate.checkSwapMatchesQuery("1", tkns.ETH, tkns.axlUSDC);
    });
  });

  it("Query returns zero if tokens not found", async () => {
    const supportedTkn = tkns.ETH;
    await ate.checkQueryReturnsZeroForUnsupportedTkns(supportedTkn);
  });

  it("Gas-estimate is between max-gas-used and 110% max-gas-used", async () => {
    const options = [["1", tkns.axlUSDC, tkns.ETH]];
    await ate.checkGasEstimateIsSensible(options);
  });
});
