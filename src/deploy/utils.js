module.exports.addresses = require('../misc/addresses.json')
module.exports.constants = require('../misc/constants.json')

module.exports.deployUniV2Contract = (
    networkName,
    tags,
    name, 
    factory,
    fee,
) => {
    const adapterType = 'univ2'
    const contractName = 'UniswapV2Adapter'
    const gasEstimate = 120000
    tags = [ ...tags, adapterType ]
    return _deployAdapter(
        networkName,
        tags, 
        name, 
        contractName, 
        [name, factory, fee, gasEstimate]
    )
}

module.exports.deployMinimalRouter = (networkName) => {
    const deployOptions = require('../misc/deployOptions')[networkName]
    const exportEnv = async ({ getNamedAccounts, deployments }) => {
        const { deployer } = await getNamedAccounts()
        if (!deployOptions)
            throw new Error(`Can't find deployOptions for network: "${networkName}"`)

        const feeClaimer = deployer
        const { minimalAdapterWhitelist, hopTokens, wnative } = deployOptions
        const adapters = await Promise.all(minimalAdapterWhitelist.map(a => deployments.get(a)))
            .then(a => a.map(_a => _a.address))
        const deployArgs = [
            adapters, 
            hopTokens, 
            feeClaimer, 
            wnative,
        ]
        console.log('YakRouter deployment arguments: ', deployArgs)

        const name = 'MinimalYakRouter'
        const contractName = 'YakRouter'
        const optionalArgs = { gas: 4000000 }
        const deployFn = _deployContract(name, contractName, deployArgs, optionalArgs)
        await deployFn({ getNamedAccounts, deployments })
    }
    exportEnv.tags = [ 'router', networkName ]
    exportEnv.dependencies = deployOptions.minimalAdapterWhitelist
    
    return exportEnv
}

module.exports.deployYakWrapRouter = (networkName, routerDeploymentName) => {
    const deployOptions = require('../misc/deployOptions')[networkName]
    const exportEnv = async ({ getNamedAccounts, deployments }) => {
        const { deployer } = await getNamedAccounts()
        if (!deployOptions)
            throw new Error(`Can't find deployOptions for network: "${networkName}"`)

        router = await deployments.get(routerName)
        const deployArgs = [
            router.address
        ]
        console.log('YakWrapRouter deployment arguments: ', deployArgs)

        const name = 'YakWrapRouter'
        const contractName = 'YakWrapRouter'
        const optionalArgs = { gas: 4000000 }
        const deployFn = _deployContract(name, contractName, deployArgs, optionalArgs)
        await deployFn({ getNamedAccounts, deployments })
    }
    exportEnv.tags = [ 'wrapRouter', networkName ]
    exportEnv.dependencies = [routerDeploymentName]
    
    return exportEnv
}

module.exports.deployRouter = (networkName) => {
    const deployOptions = require('../misc/deployOptions')[networkName]
    const exportEnv = async ({ getNamedAccounts, deployments }) => {
        const { deployer } = await getNamedAccounts()
        if (!deployOptions)
            throw new Error(`Can't find deployOptions for network: "${networkName}"`)

        const feeClaimer = deployer
        const { adapterWhitelist, hopTokens, wnative } = deployOptions
        const adapters = await Promise.all(adapterWhitelist.map(a => deployments.get(a)))
            .then(a => a.map(_a => _a.address))
        const deployArgs = [
            adapters, 
            hopTokens, 
            feeClaimer, 
            wnative,
        ]
        console.log('YakRouter deployment arguments: ', deployArgs)

        const name = 'YakRouter'
        const contractName = 'YakRouter'
        const optionalArgs = { gas: 4000000 }
        const deployFn = _deployContract(name, contractName, deployArgs, optionalArgs)
        await deployFn({ getNamedAccounts, deployments })
    }
    exportEnv.tags = ['router', networkName, concatTags('router', networkName)]
    exportEnv.dependencies = deployOptions.adapterWhitelist
    
    return exportEnv
}

module.exports.deployAdapter = _deployAdapter

function _deployAdapter(networkName, tags, name, contractName, args) {
    tags = [ 
        'adapter', 
        ...tags,
        ...tags.map(t => concatTags(t, 'adapter', networkName))
    ]
    return deployContract(networkName, tags, name, contractName, args)
}

module.exports.deployWrapper = _deployWrapper

function _deployWrapper(networkName, tags, name, contractName, args) {
    tags = [ 
        'wrapper', 
        ...tags,
        ...tags.map(t => concatTags(t, 'wrapper', networkName))
    ]
    return deployContract(networkName, tags, name, contractName, args)
}

function deployContract(networkName, tags, name, contractName, args, optionalArgs) {
    const exportEnv = _deployContract(name, contractName, args, optionalArgs)
    exportEnv.tags = [ networkName, ...tags ]
    return exportEnv
}

function _deployContract(name, contractName, args, optionalArgs={}) {
    return async ({ getNamedAccounts, deployments }) => {
        const { deploy, log } = deployments
        const { deployer } = await getNamedAccounts()

        log(name)
        const deployResult = await deploy(name, {
            from: deployer,
            contract: contractName,
            args,
            gas: 1.5e5,
            skipIfAlreadyDeployed: true, 
            ...optionalArgs
        })

        if (deployResult.newlyDeployed) {
            log(`- ${deployResult.contractName} deployed at ${deployResult.address} using ${deployResult.receipt.gasUsed} gas`);
        } else {
            log(`- Deployment skipped, using previous deployment at: ${deployResult.address}`)
        }
    }
}

function concatTags(...tags) {
    return tags.join('_')
}