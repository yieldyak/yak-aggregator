const aggregatorView = async () => {
    
    const yakRouter = "0x187Cd11549a20ACdABd43992d01bfcF2Bfc3E18d";

    function getContract(address, name) {
        let abi = require(`../abis/${name}.json`);
        return new ethers.Contract(address, abi, ethers.provider);
    }

    const routerContract = getContract(yakRouter, "YakRouter");

    let adaptersCount = await routerContract.adaptersCount();
    let tokensCount = await routerContract.trustedTokensCount()

    let i = ethers.BigNumber.from("0");
    let adapters = new Map(); // we will populate this map with the names of the adapters and their corresponding contracts.
    
    while (i.lt(adaptersCount)) {
        let adapter = getContract(await routerContract.ADAPTERS(i), "YakAdapter");
        let data = {
            name: await adapter.name(),
            owner: await adapter.owner(),
            swapGasEstimate: await adapter.swapGasEstimate().then(value => value.toNumber())
        }
        adapters.set(data.name, data);
        
        i = i.add("1");
    }
    
    i = ethers.BigNumber.from("0")
    let trustedTokens = new Map(); // we will populate this map with the names of the tokens and their corresponding contracts.

    while (i.lt(tokensCount)) {
        let tokenAddress = await routerContract.TRUSTED_TOKENS(i)
        let token = getContract(tokenAddress, "TestToken");
        let data = {
            name: await token.name(),
            symbol: await token.symbol(),
            address: tokenAddress,
            decimals: await token.decimals(),
            total_supply: await token.totalSupply().then(value => Number(ethers.utils.formatUnits(value, this.decimals)))
        }
        trustedTokens.set(data.name, data);

        i = i.add("1");
    }

    console.log("___ ADAPTERS DATA ___".padStart(65));
    console.table([...adapters.values()]);

    console.log("\n", "___ TRUSTED TOKENS ___".padStart(65));
    console.table([...trustedTokens.values()]);
}

module.exports = aggregatorView;
