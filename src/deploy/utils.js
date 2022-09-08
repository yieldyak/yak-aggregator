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

module.exports.deployBytesManipulation = (networkName) => {
    const tags = ['library', 'bytesManipulation', 'router']
    const name = 'BytesManipulation'
    const contractName = 'BytesManipulation'
    const args = []
    return deployContract(networkName, tags, name, contractName, args)
}

module.exports.deployRouter = (networkName) => {
    const exportEnv = async ({ getNamedAccounts, deployments }) => {
        const { deployer } = await getNamedAccounts()
        const deployOptions = require('../misc/deployOptions')[networkName]
        if (!deployOptions)
            throw new Error(`Can't find deployOptions for network: "${networkName}"`)

        const feeClaimer = deployer
        const { adapterWhitelist, hopTokens, wnative } = deployOptions
        const BytesManipulation = await deployments.get('BytesManipulation')
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
        const optionalArgs = {
            libraries: {
                'BytesManipulation': BytesManipulation.address
            }, 
            gas: 4000000
        }
        const deployFn = _deployContract(name, contractName, deployArgs, optionalArgs)
        await deployFn({ getNamedAccounts, deployments })
    }
    exportEnv.tags = [ 'router', networkName ]
    
    return exportEnv
}

module.exports.deployAdapter = _deployAdapter

function _deployAdapter(networkName, tags, name, contractName, args) {
    tags = [ 'adapter', ...tags ]
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