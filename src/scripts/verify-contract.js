const path = require('path')

const verifyContract = async (deploymentFilePath, hre) => {
    console.log(`Verifying ${deploymentFilePath}`)
    const deploymentFile = require(path.join("..", deploymentFilePath))
    const args = deploymentFile.args
    const contractAddress = deploymentFile.address

    await hre.run("verify:verify", {
        address: contractAddress,
        constructorArguments: args,
    });
};

module.exports = verifyContract;