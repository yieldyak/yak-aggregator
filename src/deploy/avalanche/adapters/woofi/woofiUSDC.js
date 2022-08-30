const { other } = require("../../../../test/addresses.json")

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()

    const NAME = 'WoofiUSDCAdapter'
    const POOL = other.WoofiPoolUSDC
    const GAS_ESTIMATE = 5.25e5

    log(NAME)
    const deployResult = await deploy(NAME, {
        from: deployer,
        contract: "WoofiAdapter",
        gas: 4000000,
        args: [
            NAME,
            GAS_ESTIMATE,
            POOL,
        ],
        skipIfAlreadyDeployed: true
    });

    if (deployResult.newlyDeployed) {
        log(`- ${deployResult.contractName} deployed at ${deployResult.address} using ${deployResult.receipt.gasUsed} gas`);
    } else {
        log(`- Deployment skipped, using previous deployment at: ${deployResult.address}`)
    }
}

module.exports.tags = ['V0', 'adapter', 'woofiUSDC', 'avalanche'];