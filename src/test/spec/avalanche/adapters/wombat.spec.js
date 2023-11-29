const { setTestEnv, addresses } = require("../../../utils/test-env");
const { wombat } = addresses.avalanche;

describe("YakAdapter - Wombat", () => {
  let testEnv;
  let tkns;
  let ate; // adapter-test-env

  before(async () => {
    const networkName = "avalanche";
    const forkBlockNumber = 38388903;
    testEnv = await setTestEnv(networkName, forkBlockNumber);
    tkns = testEnv.supportedTkns;

    const contractName = "WombatAdapter";
    const adapterArgs = ["WombatAdapter", 290_000, [wombat.savax, wombat.main, wombat.usdv]];
    ate = await testEnv.setAdapterEnv(contractName, adapterArgs);
  });

  beforeEach(async () => {
    testEnv.updateTrader();
  });

  describe("Swapping matches query :: savax", async () => {
    it("100 SAVAX -> WAVAX", async () => {
      await ate.checkSwapMatchesQuery("100", tkns.SAVAX, tkns.WAVAX);
    });
    it("100 WAVAX -> SAVAX", async () => {
      await ate.checkSwapMatchesQuery("100", tkns.WAVAX, tkns.SAVAX);
    });
  });

  describe("Swapping matches query :: main", async () => {
    it("100 USDC -> USDT", async () => {
      await ate.checkSwapMatchesQuery("100", tkns.USDC, tkns.USDt);
    });
    it("100 USDT -> USDC", async () => {
      await ate.checkSwapMatchesQuery("100", tkns.USDt, tkns.USDC);
    });
  });

  describe("Swapping matches query :: usdv", async () => {
    it("10 USDT -> USDV", async () => {
      await ate.checkSwapMatchesQuery("100", tkns.USDt, tkns.USDV);
    });
  });

  it("Query returns zero if tokens not found", async () => {
    const supportedTkn = tkns.USDC;
    ate.checkQueryReturnsZeroForUnsupportedTkns(supportedTkn);
  });

  it("Gas-estimate is between max-gas-used and 110% max-gas-used", async () => {
    const options = [["1", tkns.SAVAX, tkns.WAVAX]];
    await ate.checkGasEstimateIsSensible(options);
  });
});
