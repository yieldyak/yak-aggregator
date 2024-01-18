const { setTestEnv, addresses } = require("../../../utils/test-env");
const { wombat } = addresses.arbitrum;

describe("YakAdapter - Wombat", () => {
  let testEnv;
  let tkns;
  let ate; // adapter-test-env

  before(async () => {
    const networkName = "arbitrum";
    const forkBlockNumber = 171366228;
    testEnv = await setTestEnv(networkName, forkBlockNumber);
    tkns = testEnv.supportedTkns;

    const contractName = "WombatAdapter";
    const adapterArgs = ["WombatAdapter", 280_000,  [wombat.main, wombat.frax_sfrax_usdc, wombat.frax_usdv, wombat.frxETH, wombat.fusdc, wombat.mpendle_pendle]];
    ate = await testEnv.setAdapterEnv(contractName, adapterArgs);
  });

  beforeEach(async () => {
    testEnv.updateTrader();
  });

  describe("Swapping matches query :: main", async () => {
    it("100 USDC -> USDT", async () => {
      await ate.checkSwapMatchesQuery("100", tkns.USDC, tkns.USDT);
    });
    it("100 USDT -> USDC", async () => {
      await ate.checkSwapMatchesQuery("100", tkns.USDT, tkns.USDC);
    });
  });

  describe("Swapping matches query :: usdv", async () => {
    it("10 USDC -> DAI", async () => {
      await ate.checkSwapMatchesQuery("100", tkns.USDC, tkns.DAI);
    });
  });

  it("Query returns zero if tokens not found", async () => {
    const supportedTkn = tkns.USDC;
    ate.checkQueryReturnsZeroForUnsupportedTkns(supportedTkn);
  });

  it("Gas-estimate is between max-gas-used and 110% max-gas-used", async () => {
    const options = [["1", tkns.USDC, tkns.USDT]];
    await ate.checkGasEstimateIsSensible(options);
  });
});
