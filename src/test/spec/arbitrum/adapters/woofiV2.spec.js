const { expect } = require("chai");
const { setTestEnv, addresses } = require("../../../utils/test-env");
const { woofiV2Pool } = addresses.arbitrum.other;

describe("YakAdapter - woofiV2", () => {
  let testEnv;
  let tkns;
  let ate; // adapter-test-env

  before(async () => {
    const networkName = "arbitrum";
    const forkBlockNumber = 204016043;
    testEnv = await setTestEnv(networkName, forkBlockNumber);
    tkns = testEnv.supportedTkns;

    const contractName = "WoofiV2Adapter";
    const adapterArgs = ["WoofiV2Adapter", 410_000, woofiV2Pool];
    ate = await testEnv.setAdapterEnv(contractName, adapterArgs);
  });

  beforeEach(async () => {
    testEnv.updateTrader();
  });

  describe("Swapping matches query :: base->quote", async () => {
    it("1 WETH -> USDC", async () => {
      await ate.checkSwapMatchesQuery("1", tkns.WETH, tkns.USDC);
    });
    it("1 WBTC -> USDC", async () => {
      await ate.checkSwapMatchesQuery("1", tkns.WBTC, tkns.USDC);
    });
  });

  describe("Swapping matches query :: base->quote", async () => {
    it("1 USDC -> WETH", async () => {
      await ate.checkSwapMatchesQuery("1", tkns.USDC, tkns.WETH);
    });
    it("1 USDC -> WBTC", async () => {
      await ate.checkSwapMatchesQuery("1", tkns.USDC, tkns.WBTC);
    });
  });

  describe("Swapping matches query :: base->base", async () => {
    it("1 WETH -> WBTC :: 1 bps err", async () => {
      const errBps = 1;
      await ate.checkSwapMatchesQueryWithErr("1", tkns.WETH, tkns.WBTC, errBps);
    });
    it("0.01 WBTC -> USDC", async () => {
      await ate.checkSwapMatchesQuery("0.01", tkns.WBTC, tkns.USDC);
    });
  });

  it("Query returns zero if tokens not found", async () => {
    const supportedTkn = tkns.USDC;
    ate.checkQueryReturnsZeroForUnsupportedTkns(supportedTkn);
  });

  it("Gas-estimate is between max-gas-used and 110% max-gas-used", async () => {
    const options = [
      ["1", tkns.USDC, tkns.WBTC],
      ["1", tkns.WETH, tkns.USDC],
    ];
    await ate.checkGasEstimateIsSensible(options);
  });
});
