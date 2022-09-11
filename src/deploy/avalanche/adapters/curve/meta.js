const { deployAdapter, addresses } = require("../../../utils");
const { CurveMim, CurveMore, CurveDeUSDC, CurveAave } = addresses.avalanche.curvelikePools;
const { curveMetaSwapper } = addresses.avalanche.other;

const networkName = "avalanche";
const tags = ["curve", "curveMim", "curveMore", "curveDeUSDC"];
const name = "CurveMetaAdapter";
const contractName = "CurveMetaWithSwapperAdapter";

const metaPools = [CurveMim, CurveMore, CurveDeUSDC];
const basePools = Array(3).fill(CurveAave);
const swapper = curveMetaSwapper;
const gasEstimate = 1_200_000;
const args = [name, gasEstimate, metaPools, basePools, swapper];

module.exports = deployAdapter(networkName, tags, name, contractName, args);
