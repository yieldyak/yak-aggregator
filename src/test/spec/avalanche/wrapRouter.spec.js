const { setTestEnv, addresses } = require("../../utils/test-env");
const { deployContract } = require("../../helpers");
const { GmxRewardRouter } = addresses.avalanche.other;

describe("YakWrapRouter", () => {
  let testEnv;
  let tkns;
  let ate; // adapter-test-env
  let wrapRouter;
  let adapter;

  before(async () => {
    const networkName = "avalanche";
    const forkBlockNumber = 22155630;
    testEnv = await setTestEnv(networkName, forkBlockNumber);
    tkns = testEnv.supportedTkns;

    const contractName = "GlpWrapper";
    const adapterArgs = ["GlpWrapper", 1_100_000, GmxRewardRouter];
    ate = await testEnv.setAdapterEnv(contractName, adapterArgs);
    adapter = ate.Adapter.address;

    const yakRouter = "0xC4729E56b831d74bBc18797e0e17A295fA77488c";
    const routerArgs = [yakRouter];
    wrapRouter = await deployContract("YakWrapRouter", { args: routerArgs, deployer: testEnv.deployer });
    await ate.Adapter.setWhitelistedTokens([tkns.WAVAX.address, tkns.WETHe.address, tkns.BTCb.address]);
  });

  describe("Find best path", async () => {
    it("For wrap", async () => {
      const amountIn = ethers.utils.parseEther("100");
      console.log(await wrapRouter.findBestPathAndWrap(amountIn, tkns.DAI.address, adapter, 3, 2000));
    });
    it("For unwrap ", async () => {
      const amountIn = ethers.utils.parseEther("100");
      console.log(await wrapRouter.unwrapAndFindBestPath(amountIn, tkns.DAI.address, adapter, 3, 2000));
    });
  });
});
