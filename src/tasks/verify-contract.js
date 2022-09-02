const { task } = require("hardhat/config");
const path = require('path')

// to verify all contracts use
// find ./deployments/mainnet -maxdepth 1 -type f -not -path '*/\.*' -path "*.json" | xargs -L1 npx hardhat verifyContract --deployment-file-path --network mainnet
task(
    "verify-contract",
    "Verifies the contract in the explorer",
    async function ({ deploymentFilePath }, hre, _) {
        console.log(`Verifying ${deploymentFilePath}`)
        const deploymentFile = require(path.join("..", deploymentFilePath))
        const args = deploymentFile.args
        const contractAddress = deploymentFile.address
    
        await hre.run("verify:verify", {
            address: contractAddress,
            constructorArguments: args,
        });
    }
).addParam("deploymentFilePath", "Deployment file path")
