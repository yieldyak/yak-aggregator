const { balancerlikePools, balancerlikeVaults } = require("../../../../misc/addresses.json").avalanche

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()

    const NAME = 'EmbrAdapterV0'
    const VAULT = balancerlikeVaults.embr
    const POOLS = Object.values(balancerlikePools)
    const GAS_ESTIMATE = 258000

    log(NAME)
    const deployResult = await deploy(NAME, {
        from: deployer,
        contract: "BalancerlikeAdapter",
        gas: 4000000,
        args: [
            NAME,
            VAULT,
            POOLS,
            GAS_ESTIMATE
        ],
        skipIfAlreadyDeployed: true
    });

    if (deployResult.newlyDeployed) {
        log(`- ${deployResult.contractName} deployed at ${deployResult.address} using ${deployResult.receipt.gasUsed} gas`);
    } else {
        log(`- Deployment skipped, using previous deployment at: ${deployResult.address}`)
    }
}

module.exports.tags = ['V0', 'adapter', 'embr', 'ausd', 'wavax', 'avalanche'];