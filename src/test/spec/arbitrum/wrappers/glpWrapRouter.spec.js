const { setTestEnv, addresses } = require("../../../utils/test-env");
const { deployContract } = require("../../../helpers");
const { ethers } = require("hardhat");
const { rewardRouter } = addresses.arbitrum.gmx;
const { GLP, sGLP } = addresses.arbitrum.assets;

describe("GLP Wrap Router", () => {
  let testEnv;
  let tkns;
  let ate; // adapter-test-env
  let wrapRouter;
  let adapter;

  before(async () => {
    const networkName = "arbitrum";
    const forkBlockNumber = 74516597;
    testEnv = await setTestEnv(networkName, forkBlockNumber);
    tkns = testEnv.supportedTkns;

    const contractName = "GlpWrapperFeeSelection";
    const adapterArgs = [
      "GlpWrapperFeeSelection",
      1_100_000,
      rewardRouter,
      [
        tkns.WETH.address,
        tkns.WBTC.address,
        tkns.LINK.address,
        tkns.UNI.address,
        tkns.USDC.address,
        tkns.USDT.address,
        tkns.DAI.address,
        tkns.FRAX.address,
      ],
      10000,
      3,
      GLP,
      sGLP,
    ];
    ate = await testEnv.setAdapterEnv(contractName, adapterArgs);
    adapter = ate.Adapter.address;

    const yakRouter = "0xb32C79a25291265eF240Eb32E9faBbc6DcEE3cE3";
    const routerArgs = [yakRouter];
    wrapRouter = await deployContract("YakWrapRouter", { args: routerArgs, deployer: testEnv.deployer });

    // const routerOwnerAddress = "0xd22044706DeA3c342f68396bEDBCf6a2536d951D";
    // await testEnv.deployer.sendTransaction({
    //   to: routerOwnerAddress,
    //   value: ethers.utils.parseEther("1.0"),
    // });
    // const routerOwner = await getSignerForAddress(routerOwnerAddress);
    // await startImpersonatingAccount(routerOwnerAddress);
    // const router = await ethers.getContractAt("src/contracts/YakRouter.sol:YakRouter", yakRouter);
    // await router.connect(routerOwner).setAdapters([
    //   "0x19eb54ccB443aCED9dcbC960bA98064A13262Ef3", // WETH
    //   // "0xc5b9041F9748A9A4437Ba90f9806cE8c3F9085Fc", // Uniswap
    //   "0xFCFa6855b3E79f1c3ae4314cC0e85f37DfA14B3F", // LiquidityBook
    //   // "0x0FdF64B6746BA759d120e973C85349a8B9CdE8D4", // Kyber Elastics
    //   // "0x9D609aD3c673E2ddB3047C3F3B3efa2Ce14EB436", // Camelot
    //   "0xb60CE5bF2A231EDA70825f9cdcD0795102218ab0", // GMX
    //   // "0x4a6c794192831fB9F4782E61Bec05d6C5cC9F3eA", // Woofi
    // ]);
    // await stopImpersonatingAccount(routerOwnerAddress);
  });

  describe("Find best path", async () => {
    it("For wrap", async () => {
      const amountIn = ethers.utils.parseEther("10");
      await wrapRouter.findBestPathAndWrap(amountIn, tkns.WETH.address, adapter, 2, 2000);
    });
    it("For unwrap ", async () => {
      const amountIn = ethers.utils.parseEther("100000");
      await wrapRouter.unwrapAndFindBestPath(amountIn, tkns.DAI.address, adapter, 2, 2000);
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
