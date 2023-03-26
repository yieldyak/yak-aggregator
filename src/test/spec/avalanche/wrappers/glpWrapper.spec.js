const { expect } = require("chai");
const { ethers } = require("hardhat");
const { setTestEnv, addresses } = require("../../../utils/test-env");
const { GmxRewardRouter } = addresses.avalanche.other;
const { GLP, sGLP } = addresses.avalanche.assets;

describe("GlpWrapper", () => {
  let testEnv;
  let tkns;
  let ate; // adapter-test-env

  before(async () => {
    const networkName = "avalanche";
    const forkBlockNumber = 25104796;
    testEnv = await setTestEnv(networkName, forkBlockNumber);
    tkns = testEnv.supportedTkns;

    const contractName = "GlpWrapper";
    const adapterArgs = ["GlpWrapper", 1_100_000, GmxRewardRouter, GLP, sGLP];
    ate = await testEnv.setAdapterEnv(contractName, adapterArgs);
    testEnv.updateTrader();
  });

  describe("Query is correct", async () => {
    it("1 WAVAX -> fsGLP", async () => {
      await ate.queryMatches(
        ethers.utils.parseEther("1"),
        tkns.WAVAX.address,
        tkns.sGLP.address,
        "22856918361992666713"
      );
    });
  });

  describe("Swapping matches query", async () => {
    it("100 WAVAX -> fsGLP", async () => {
      expect(await tkns.fsGLP.balanceOf(testEnv.trader.address)).eq(0);
      const amountIn = ethers.utils.parseEther("100");
      const queryDy = await ate.query(amountIn, tkns.WAVAX.address, tkns.sGLP.address);
      await ate.mintAndSwap(amountIn, queryDy, tkns.WAVAX, tkns.sGLP);
      expect(await tkns.fsGLP.balanceOf(testEnv.trader.address)).eq(queryDy);
    });

    it("100 fsGLP -> WAVAX", async () => {
      await tkns.sGLP
        .connect(testEnv.trader)
        .transfer(ate.Adapter.address, await tkns.fsGLP.balanceOf(testEnv.trader.address));
      expect(await tkns.fsGLP.balanceOf(ate.Adapter.address)).gt(0);
      const balanceBefore = await tkns.WAVAX.balanceOf(testEnv.trader.address);
      const amountIn = ethers.utils.parseEther("100");
      const queryDy = await ate.query(amountIn, tkns.sGLP.address, tkns.WAVAX.address);
      await ate.Adapter.connect(testEnv.trader).swap(
        amountIn,
        queryDy,
        tkns.sGLP.address,
        tkns.WAVAX.address,
        testEnv.trader.address
      );
      expect(await tkns.WAVAX.balanceOf(testEnv.trader.address)).eq(queryDy.add(balanceBefore));
    });
  });

  it("Query returns zero if tokens not found", async () => {
    const supportedTkn = tkns.sGLP;
    ate.checkQueryReturnsZeroForUnsupportedTkns(supportedTkn);
  });
});
