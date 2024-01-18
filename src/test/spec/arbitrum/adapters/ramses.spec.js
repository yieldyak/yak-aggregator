const { expect } = require("chai");
const { ethers } = require("hardhat");
const { setTestEnv, addresses } = require("../../../utils/test-env");
const { ramses } = addresses.arbitrum;

describe("YakAdapter - Ramses", function () {
  let testEnv;
  let tkns;
  let ate; // adapter-test-env

  before(async () => {
    const networkName = "arbitrum";
    const forkBlockNumber = 171350880;
    testEnv = await setTestEnv(networkName, forkBlockNumber);
    tkns = testEnv.supportedTkns;

    const contractName = "RamsesV2Adapter";
    const gasEstimate = 325_000;
    const quoterGasLimit = gasEstimate;
    const defaultFees = [50, 100, 250, 500, 3_000, 10_000];
    const adapterArgs = ["RamsesV2Adapter", gasEstimate, quoterGasLimit, ramses.quoter, ramses.factory, defaultFees];
    ate = await testEnv.setAdapterEnv(contractName, adapterArgs);
  });

  beforeEach(async () => {
    testEnv.updateTrader();
  });

  describe("Swapping matches query", async () => {
    it("50 ARB -> WETH", async () => {
      await ate.checkSwapMatchesQuery("50", tkns.ARB, tkns.WETH);
    });

    it("200 USDC -> USDCe", async () => {
      await ate.checkSwapMatchesQuery("200", tkns.USDC, tkns.USDCe);
    });
  });

  it('Query returns zero if tokens not found', async () => {
      const supportedTkn = tkns.ARB
      ate.checkQueryReturnsZeroForUnsupportedTkns(supportedTkn)
  })

  it('Swapping too much returns zero', async () => {
      const dy = await ate.Adapter.query(
          ethers.utils.parseUnits('10000', 18),
          tkns.USDC.address,
          tkns.WETH.address
      )
      expect(dy).to.eq(0)
  })

  it('Adapter can only spend max-gas + buffer', async () => {
      const gasBuffer = ethers.BigNumber.from('70000')
      const quoterGasLimit = await ate.Adapter.quoterGasLimit()
      const dy = await ate.Adapter.estimateGas.query(
          ethers.utils.parseUnits('2000', 6),
          tkns.USDC.address,
          tkns.WETH.address
      )
      expect(dy).to.lt(quoterGasLimit.add(gasBuffer))
  })

  it('Gas-estimate is between max-gas-used and 110% max-gas-used', async () => {
      const options = [
          [ '10', tkns.USDC, tkns.WETH ]
      ]
      await ate.checkGasEstimateIsSensible(options)
  })
});
