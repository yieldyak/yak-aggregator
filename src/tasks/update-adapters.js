const { task } = require("hardhat/config");
const prompt = require("prompt-sync")({ sigint: true });

task(
    "update-adapters",
    "Updates YakRouter's adapters according to `deployOptions.json`.'",
    async function (_, hre, _) {
        const networkId = hre.network.name
        const [ deployer ] = await hre.ethers.getSigners()
        const YakRouter = await getRouterContract(networkId)
        const adaptersWhitelist = await getAdapterWhitelist(hre.deployments, networkId)
        await updateAdapters(YakRouter, deployer, adaptersWhitelist)
    }
);

async function getRouterContract(networkId) {
    const routerAddress = getRouterAddressForNetworkId(networkId)
    return getRouterContractForAddress(routerAddress)
}

function getRouterAddressForNetworkId(networkId) {
    return getRouterDeployment(networkId).address
}

function getRouterDeployment(networkId) {
    const path = `../deployments/${networkId}/YakRouterV0.json`
    try {
        return require(path)
    } catch {
        throw new Error(`Can't find router deployment for networkID: "${networkId}"`)
    }
}

async function getRouterContractForAddress(routerAddress) {
    return ethers.getContractAt('YakRouter', routerAddress)
}

async function updateAdapters(yakRouter, deployerSigner, adaptersWhitelist) {
    let currentAdapters = await getAdaptersForRouter(yakRouter)
    let allAdaptersIncluded = haveSameElements(currentAdapters, adaptersWhitelist)   
    if (allAdaptersIncluded) {
        console.log('Current adapters match whitelist')
        return
    }
    showDiff(currentAdapters, adaptersWhitelist)   
    if (prompt("Proceed to set adapters? y/n") == 'y') {
        await yakRouter
            .connect(deployerSigner)
            .setAdapters(adaptersWhitelist)
            .then(finale)
    }
}

function showDiff(currentHopTokens, hopTokensWhitelist)  {
    const diff = findDiff(currentHopTokens, hopTokensWhitelist) 
    console.log('Difference:')
    console.table(diff)
}

function haveSameElements(arr1, arr2) {
    return arr1.length == arr2.length && arr1.every(a => arr2.includes(a))
}

async function getAdapterWhitelist(deployments, networkId) {
    const whitelistNamed = getAdapterWhitelistNamed(networkId)
    return Promise.all(whitelistNamed.map(a => deployments.get(a)))
      .then(a => a.map(_a => _a.address))
}

function getAdapterWhitelistNamed(networkId) {
    const deployOptions = require('../misc/deployOptions')
    if (!deployOptions[networkId] || !deployOptions[networkId].adapterWhitelist)
        throw new Error(`Can't find adapter-whitelist for networkId: ${networkId}`)
    return deployOptions[networkId].adapterWhitelist
}

async function getAdaptersForRouter(yakRouter) {
    let adapterCount = await yakRouter.adaptersCount().then(r => r.toNumber())
    return Promise.all([...Array(adapterCount).keys()].map(i => yakRouter.ADAPTERS(i)))
}

async function finale(res) {
    console.log(`Transaction pending: ${res.hash}`)
    await res.wait()
    console.log('Done! 🎉')
}