const { task } = require("hardhat/config");
const prompt = require("prompt-sync")({ sigint: true });
const { SafeManager } = require("../misc/SafeManager");

task(
    "update-adapters",
    "Updates YakRouter's adapters according to `deployOptions.json`.'",
    async function (_, hre, _) {
        const networkId = hre.network.name
        const [ deployer ] = await hre.ethers.getSigners()
        const YakRouter = await getRouterContract(networkId)
        const adaptersWhitelist = await getAdapterWhitelist(hre.deployments, networkId)
        const safeManager = new SafeManager(deployer, hre.ethers)
        await safeManager.initializeSafe(networkId)      
        await updateAdapters(YakRouter, deployer, adaptersWhitelist, safeManager)
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
    const path = `../deployments/${networkId}/YakRouter.json`
    try {
        return require(path)
    } catch {
        throw new Error(`Can't find router deployment for networkID: "${networkId}"`)
    }
}

async function getRouterContractForAddress(routerAddress) {
    return ethers.getContractAt('YakRouter', routerAddress)
}

async function updateAdapters(yakRouter, deployerSigner, adaptersWhitelist, safeManager) {
    let currentAdapters = await getAdaptersForRouter(yakRouter)
    let allAdaptersIncluded = haveSameElements(currentAdapters, adaptersWhitelist)   
    if (allAdaptersIncluded) {
        console.log('Current adapters match whitelist')
        return
    }
    showDiff(currentAdapters, adaptersWhitelist)   
    if (prompt("Proceed to set adapters? y/n") == 'y') {
        if (safeManager.safeAvailable) {
            const transaction = await yakRouter
                .setAdapters
                .populateTransaction(adaptersWhitelist)
            const safeTransactionData = [
                {
                  to: await yakRouter.getAddress(),
                  value: "0",
                  data: transaction.data,
                },
            ];
            const safeTx = await safeManager.createSafeTransaction(safeTransactionData);
            const { safeSignature } = await safeManager.signTransaction(safeTx);
            await safeManager.proposeTransaction(safeTx, safeSignature);          
        } else {
            await yakRouter
                .connect(deployerSigner)
                .setAdapters(adaptersWhitelist)
                .then(finale)
        }
    }
}

function showDiff(currentHopTokens, hopTokensWhitelist)  {
    const diff = findDiff(currentHopTokens, hopTokensWhitelist) 
    console.log('Difference:')
    console.table(diff)
}

function haveSameElements(arr1, arr2) {
    return arr2.every(a => arr1.includes(a)) && arr1.every(a => arr2.includes(a))
}

function findDiff(actual, desired) {
    const addTags = (arr, tag) => Object.fromEntries(arr.map(e => [e, tag]))
    const toRm = actual.filter(e1 => !desired.some(e2 => e1 == e2))
    const toAdd = desired.filter(e1 => !actual.some(e2 => e1 == e2))
    return {
        ...addTags(toAdd, 'add'),
        ...addTags(toRm, 'rm'),
    }
}

async function getAdapterWhitelist(deployments, networkId) {
    const whitelistNamed = getAdapterWhitelistNamed(networkId)
    return Promise.all(whitelistNamed.map(adapterName => {
        return deployments.get(adapterName).then(deployment => {
            if (deployment)
                return deployment.address
            else
                throw new Error(`No deployment for ${adapterName}`)
        })
    }))
}

function getAdapterWhitelistNamed(networkId) {
    const deployOptions = require('../misc/deployOptions')
    if (!deployOptions[networkId] || !deployOptions[networkId].adapterWhitelist)
        throw new Error(`Can't find adapter-whitelist for networkId: ${networkId}`)
    return deployOptions[networkId].adapterWhitelist
}

async function getAdaptersForRouter(yakRouter) {
    let adapterCount = await yakRouter.adaptersCount()
    return Promise.all([...Array(Number(adapterCount)).keys()].map(i => yakRouter.ADAPTERS(i)))
}

async function finale(res) {
    console.log(`Transaction pending: ${res.hash}`)
    await res.wait()
    console.log('Done! 🎉')
}