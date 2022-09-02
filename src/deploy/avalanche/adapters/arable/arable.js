const { ArableSF } = require("../../../../misc/addresses.json").avalanche.other

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()

    const name = 'ArableAdapter'
    const vault = ArableSF
    const gasEstimate = 235_000

    log(name)
    const deployResult = await deploy(name, {
        from: deployer,
        contract: "ArableSFAdapter",
        gas: 9000000,
        args: [
            name,
            vault,
            gasEstimate
        ],
        skipIfAlreadyDeployed: true
    });

    if (deployResult.newlyDeployed)
        log(`- ${deployResult.contractName} deployed at ${deployResult.address} using ${deployResult.receipt.gasUsed} gas`);
    else
        log(`- Deployment skipped, using previous deployment at: ${deployResult.address}`)
}

module.exports.tags = ['V0', 'adapter', 'arable', 'avalanche'];