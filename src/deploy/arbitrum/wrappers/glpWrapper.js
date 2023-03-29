const { deployWrapper, addresses } = require("../../utils");
const { rewardRouter } = addresses.arbitrum.gmx;
const { GLP, sGLP, WETH, WBTC, LINK, UNI, USDC, USDT, DAI, FRAX } = addresses.arbitrum.assets;

const networkName = "arbitrum";
const tags = ["gmx"];
const name = "GlpWrapperFeeSelection";
const contractName = "GlpWrapperFeeSelection";

const gasEstimate = 1_600_000;
const args = [
  "GlpWrapper",
  gasEstimate,
  rewardRouter,
  [WETH, WBTC, LINK, UNI, USDC, USDT, DAI, FRAX],
  10000,
  3,
  GLP,
  sGLP,
];

module.exports = deployWrapper(networkName, tags, name, contractName, args);
