const { expect } = require("chai");
const { setTestEnv, addresses } = require("../../../utils/test-env");
const { aerodrom } = addresses.base;

describe("YakAdapter - Aerodrom", function () {
  let testEnv;
  let tkns;
  let ate; // adapter-test-env

  before(async () => {
    const networkName = "base";
    const forkBlockNumber = 3524768;
    testEnv = await setTestEnv(networkName, forkBlockNumber);
    tkns = testEnv.supportedTkns;

    const contractName = "VelodromeV2Adapter";
    const adapterArgs = ["AerodromAdapter", aerodrom.factory, 4e5];
    ate = await testEnv.setAdapterEnv(contractName, adapterArgs);
  });

  beforeEach(async () => {
    testEnv.updateTrader();
  });

  describe("Swapping matches query", async () => {
    it("10000 USDbC -> USD+", async () => {
      await ate.checkSwapMatchesQuery("10000", tkns.USDbC, tkns["USD+"]);
    });
    it("10000 WETH -> DAI+", async () => {
      await ate.checkSwapMatchesQuery("1", tkns.ETH, tkns["DAI+"]);
    });
  });

  it("Query returns zero if tokens not found", async () => {
    const supportedTkn = tkns.ETH;
    await ate.checkQueryReturnsZeroForUnsupportedTkns(supportedTkn);
  });

  it("Gas-estimate is between max-gas-used and 110% max-gas-used", async () => {
    const options = [["10000", tkns.USDbC, tkns["USD+"]]];
    await ate.checkGasEstimateIsSensible(options);
  });
});
