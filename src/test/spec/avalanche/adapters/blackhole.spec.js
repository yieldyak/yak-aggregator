const { expect } = require("chai");
const { ethers } = require("hardhat");
const { setTestEnv, addresses } = require("../../../utils/test-env");
const { blackhole } = addresses.avalanche;

describe("YakAdapter - Blackhole", function () {
  let testEnv;
  let tkns;
  let ate;

  before(async () => {
    const networkName = "avalanche";
    testEnv = await setTestEnv(networkName);
    tkns = testEnv.supportedTkns;

    const contractName = "BlackholeV1Adapter";
    const gasEstimate = 340_000;
    const adapterArgs = [contractName, blackhole.factory, gasEstimate];
    ate = await testEnv.setAdapterEnv(contractName, adapterArgs);
  });

  beforeEach(async () => {
    testEnv.updateTrader();
  });

  describe("Swapping matches query", () => {
    it("50 EURC -> USDC", async () => {
      const amountIn = "50";
      const tokenIn = tkns.EURC;
      const tokenOut = tkns.USDC;
  
      const rawQuote = await ate.Adapter.query(
        ethers.utils.parseUnits(amountIn, 6), 
        tokenIn.address,
        tokenOut.address
      );
  
      console.log(`💱 Quote for swapping ${amountIn} EURC to USDC: ${ethers.utils.formatUnits(rawQuote, 6)} USDC`);
  
      expect(rawQuote).to.be.gt(0, "Expected a non-zero quote");
  
      await ate.checkSwapMatchesQuery(amountIn, tokenIn, tokenOut);
    });
  });

  it("Query returns zero if tokens not found", async () => {
    await ate.checkQueryReturnsZeroForUnsupportedTkns(tkns.EURC);
  });

  it("Swapping too much returns zero", async () => {
    const dy = await ate.Adapter.query(
      ethers.utils.parseUnits("10000", 18),
      tkns.EURC.address,
      tkns.USDC.address
    );
    expect(dy).to.eq(0);
  });

  it("Adapter can only spend max-gas + buffer", async () => {
    const gasBuffer = ethers.BigNumber.from("70000");
    const gasLimit = ethers.BigNumber.from(await ate.Adapter.swapGasEstimate());
    const gasUsed = await ate.Adapter.estimateGas.query(
      ethers.utils.parseUnits("2000", 6),
      tkns.EURC.address,
      tkns.USDC.address
    );
    expect(gasUsed).to.lt(gasLimit.add(gasBuffer));
  });

  it("Gas-estimate is between max-gas-used and 110% max-gas-used", async () => {
    const options = [["10", tkns.EURC, tkns.USDC]];
    await ate.checkGasEstimateIsSensible(options);
  });
});
