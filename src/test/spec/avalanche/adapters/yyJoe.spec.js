const { setTestEnv, addresses } = require("../../../utils/test-env");
const { yyJOE, JOE } = addresses.avalanche.assets;

describe("YakAdapter - yyJoe", () => {
  	let testEnv;
  	let tkns;
	let ate; // adapter-test-env

	before(async () => {
		const networkName = "avalanche";
		const forkBlockNumber = 22110113;
		testEnv = await setTestEnv(networkName, forkBlockNumber);
		tkns = testEnv.supportedTkns;

		const contractName = "YYDerivativeAdapter";
		const adapterArgs = ["YYDerivativeAdapter", 1_200_000, yyJOE, JOE];
		ate = await testEnv.setAdapterEnv(contractName, adapterArgs);
	});

	beforeEach(async () => {
		testEnv.updateTrader();
	});

	describe("Swapping matches query", async () => {
		it("1 JOE -> yyJOE", async () => {
		await ate.checkSwapMatchesQuery("1", tkns.JOE, tkns.yyJOE);
		});
	});

	it("Query returns zero if tokens not found", async () => {
		const supportedTkn = tkns.JOE;
		ate.checkQueryReturnsZeroForUnsupportedTkns(supportedTkn);
	});

	it("Gas-estimate is between max-gas-used and 110% max-gas-used", async () => {
		const options = [["1", tkns.JOE, tkns.yyJOE]];
		await ate.checkGasEstimateIsSensible(options);
	});
});
