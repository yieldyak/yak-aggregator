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
    const forkBlockNumber = 23919178;
    testEnv = await setTestEnv(networkName, forkBlockNumber);
    tkns = testEnv.supportedTkns;

    const contractName = "GlpWrapper";
    const adapterArgs = ["GlpWrapper", 1_100_000, GmxRewardRouter];
    ate = await testEnv.setAdapterEnv(contractName, adapterArgs);
    adapter = ate.Adapter.address;

    const yakRouter = "0xC4729E56b831d74bBc18797e0e17A295fA77488c";
    const routerArgs = [yakRouter];
    wrapRouter = await deployContract("YakWrapRouter", { args: routerArgs, deployer: testEnv.deployer });
    await ate.Adapter.setWhitelistedTokens([
      tkns.WAVAX.address,
      tkns.WETHe.address,
      tkns.BTCb.address,
      tkns.WBTCe.address,
      tkns.USDCe.address,
      tkns.USDC.address,
    ]);

    const routerOwnerAddress = "0xd22044706DeA3c342f68396bEDBCf6a2536d951D";
    const routerOwner = await getSignerForAddress(routerOwnerAddress);
    await startImpersonatingAccount(routerOwnerAddress);
    const router = await ethers.getContractAt("src/contracts/YakRouter.sol:YakRouter", yakRouter);
    await router.connect(routerOwner).setAdapters([
      // "0xb2a58c5e5399368716067BE72D3548F0927f0fE4",
      "0xE5a6a4279D1517231a84Fae629E433b312fe89D7",
      "0x281a2D66A979cce3E474715bDfa02bfE954E5f35",
      "0x6da140B4004D1EcCfc5FffEb010Bb7A58575b446",
      // "0x7F8B47Ff174Eaf96960a050B220a907dFa3feD5b",
      //"0x491dc06178CAF5b962DB53576a8A1456a8476232",
      "0xDB66686Ac8bEA67400CF9E5DD6c8849575B90148",
      // "0x3614657EDc3cb90BA420E5f4F61679777e4974E3",
    ]);
    await stopImpersonatingAccount(routerOwnerAddress);
  });

  describe("Find best path", async () => {
    it("For wrap", async () => {
      const amountIn = 10000e6;
      await wrapRouter.findBestPathAndWrap(amountIn, tkns.USDCe.address, adapter, 2, 2000);
    });
    it("For unwrap ", async () => {
      const amountIn = ethers.utils.parseEther("100000");
      await wrapRouter.unwrapAndFindBestPath(amountIn, tkns.USDCe.address, adapter, 2, 2000);
    });
  });

  async function startImpersonatingAccount(address) {
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [address],
    });
  }

  async function stopImpersonatingAccount(address) {
    await hre.network.provider.request({
      method: "hardhat_stopImpersonatingAccount",
      params: [address],
    });
  }

  async function getSignerForAddress(address) {
    await startImpersonatingAccount(address);
    let signer = await ethers.getSigner(address);
    await stopImpersonatingAccount(address);
    return signer;
  }
});
