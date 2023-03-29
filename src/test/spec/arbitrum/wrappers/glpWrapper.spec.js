const { expect } = require("chai");
const { ethers } = require("hardhat");
const { setTestEnv, addresses } = require("../../../utils/test-env");
const { rewardRouter } = addresses.arbitrum.gmx;
const { GLP, sGLP } = addresses.arbitrum.assets;

describe("GlpWrapper", () => {
  let testEnv;
  let tkns;
  let ate; // adapter-test-env

  before(async () => {
    const networkName = "arbitrum";
    const forkBlockNumber = 74153663;
    testEnv = await setTestEnv(networkName, forkBlockNumber);
    tkns = testEnv.supportedTkns;

    const contractName = "GlpWrapper";
    const adapterArgs = ["GlpWrapper", 1_100_000, rewardRouter, GLP, sGLP];
    ate = await testEnv.setAdapterEnv(contractName, adapterArgs);
    testEnv.updateTrader();
  });

  describe("Query is correct", async () => {
    it("1 WETH -> fsGLP", async () => {
      await ate.queryMatches(
        ethers.utils.parseEther("1"),
        tkns.WETH.address,
        tkns.sGLP.address,
        "1807179336995246348322"
      );
    });
  });

  describe("Swapping matches query", async () => {
    it("1 WETH -> sGLP", async () => {
      expect(await tkns.sGLP.balanceOf(testEnv.trader.address)).eq(0);
      const amountIn = ethers.utils.parseEther("1");
      const queryDy = await ate.query(amountIn, tkns.WETH.address, tkns.sGLP.address);
      await ate.mintAndSwap(amountIn, queryDy, tkns.WETH, tkns.sGLP);
      expect(await tkns.sGLP.balanceOf(testEnv.trader.address)).eq(queryDy);
    });

    it("100 sGLP -> WETH", async () => {
      await tkns.sGLP
        .connect(testEnv.trader)
        .transfer(ate.Adapter.address, await tkns.sGLP.balanceOf(testEnv.trader.address));
      expect(await tkns.sGLP.balanceOf(ate.Adapter.address)).gt(0);
      const balanceBefore = await tkns.WETH.balanceOf(testEnv.trader.address);
      const amountIn = ethers.utils.parseEther("100");
      const queryDy = await ate.query(amountIn, tkns.sGLP.address, tkns.WETH.address);
      await ate.Adapter.connect(testEnv.trader).swap(
        amountIn,
        queryDy,
        tkns.sGLP.address,
        tkns.WETH.address,
        testEnv.trader.address
      );
      expect(await tkns.WETH.balanceOf(testEnv.trader.address)).eq(queryDy.add(balanceBefore));
    });
  });

  it("Query returns zero if tokens not found", async () => {
    const supportedTkn = tkns.sGLP;
    ate.checkQueryReturnsZeroForUnsupportedTkns(supportedTkn);
  });
});
