const { task } = require("hardhat/config");
const path = require('path')

// npx hardhat verify-contract --network {network} --deployment-file-path {path}
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
