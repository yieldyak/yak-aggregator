const { deployWrapper, addresses } = require("../../utils");
const { rewardRouter } = addresses.arbitrum.gmx;
const { GLP, sGLP } = addresses.arbitrum.assets;
const { WETH, WBTC, LINK, UNI, USDCe, USDC, USDT, DAI, FRAX } = addresses.arbitrum.assets;

const networkName = "arbitrum";
const tags = ["gmx"];
const name = "GlpWrapper";
const contractName = "GlpWrapperFeeSelection";

const whiteListedTokens = [WETH, WBTC, LINK, UNI, USDCe, USDC, USDT, DAI, FRAX];

const gasEstimate = 1_600_000;
const args = [name, gasEstimate, rewardRouter, whiteListedTokens, 10_000, 3, GLP, sGLP];

module.exports = deployWrapper(networkName, tags, name, contractName, args);
