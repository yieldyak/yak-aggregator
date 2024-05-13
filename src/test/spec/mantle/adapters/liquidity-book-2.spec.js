const { expect } = require("chai");
const { setTestEnv, addresses } = require("../../../utils/test-env");
const { liquidityBook } = addresses.mantle;

describe("YakAdapter - LiquidityBook", function () {
  let testEnv;
  let tkns;
  let ate; // adapter-test-env

  beforeEach(async () => {
    const networkName = "mantle";
    const forkBlockNumber = 63521847;
    testEnv = await setTestEnv(networkName, forkBlockNumber);
    tkns = testEnv.supportedTkns;

    const contractName = "LB2Adapter";
    const gasEstimate = 1_000_000;
    const quoteGasLimit = 600_000;
    const adapterArgs = ["LiquidityBook2Adapter", gasEstimate, quoteGasLimit, liquidityBook.factoryV2];
    ate = await testEnv.setAdapterEnv(contractName, adapterArgs);
  });

  describe("Swapping matches query", async () => {
    it("1000 USDT -> WETH", async () => {
      await ate.checkSwapMatchesQuery("1000", tkns.USDT, tkns.WETH);
    });

    it("1000 WETH -> METH", async () => {
      await ate.checkSwapMatchesQuery("1", tkns.WETH, tkns.METH);
    });
  });

  it("Swapping too much returns zero", async () => {
    const dy = await ate.Adapter.query(ethers.utils.parseUnits("100000000", 6), tkns.USDT.address, tkns.WETH.address);
    expect(dy).to.eq(0);
  });

  it("Adapter can only spend max-gas + buffer", async () => {
    const gasBuffer = ethers.BigNumber.from("50000");
    const quoteGasLimit = await ate.Adapter.quoteGasLimit();
    const dy = await ate.Adapter.estimateGas.query(
      ethers.utils.parseUnits("10000", 6),
      tkns.USDT.address,
      tkns.WETH.address
    );
    expect(dy).to.lt(quoteGasLimit.add(gasBuffer));
  });

  it("Query returns zero if tokens not found", async () => {
    const supportedTkn = tkns.USDT;
    await ate.checkQueryReturnsZeroForUnsupportedTkns(supportedTkn);
  });

  it("Gas-estimate is between max-gas-used and 110% max-gas-used", async () => {
    const options = [
      ["1", tkns.WETH, tkns.USDT],
      ["1000", tkns.USDT, tkns.WETH],
    ];
    await ate.checkGasEstimateIsSensible(options);
  });
});
