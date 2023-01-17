const { task } = require("hardhat/config");
const prompt = require("prompt-sync")({ sigint: true });

task(
    "update-hop-tokens",
    "Updates YakRouter's hop-tokens according to `deployOptions.json`.'",
    async function (_, hre, _) {
        const networkId = hre.network.name
        const [ deployer ] = await hre.ethers.getSigners()
        const YakRouter = await getRouterContract(networkId)
        const hopTokensWhitelist = await getHopTokensWhitelist(networkId)
        await updateHopTokens(YakRouter, deployer, hopTokensWhitelist)
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

async function updateHopTokens(yakRouter, deployerSigner, hopTokensWhitelist) {
    const currentHopTokens = await getTrustedTokensForRouter(yakRouter)
    const allIncluded = haveSameElements(currentHopTokens, hopTokensWhitelist)   
    if (allIncluded) {
        console.log('Current hop-tokens match whitelist')
        return
    }
    showDiff(currentHopTokens, hopTokensWhitelist) 
    if (prompt("Proceed to set hop-tokens? y/n") == 'y') {
        await yakRouter
            .connect(deployerSigner)
            .setTrustedTokens(hopTokensWhitelist)
            .then(finale)
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

function getHopTokensWhitelist(networkId) {
    const deployOptions = require('../misc/deployOptions')
    if (!deployOptions[networkId] || !deployOptions[networkId].hopTokens)
        throw new Error(`Can't find hop-token-whitelist for networkId: ${networkId}`)
    return deployOptions[networkId].hopTokens
}

async function getTrustedTokensForRouter(yakRouter) {
    let trustedTokensCount = await yakRouter.trustedTokensCount().then(r => r.toNumber())
    return Promise.all([...Array(trustedTokensCount).keys()].map(i => yakRouter.TRUSTED_TOKENS(i)))
}

async function finale(res) {
    console.log(`Transaction pending: ${res.hash}`)
    await res.wait()
    console.log('Done! 🎉')
}