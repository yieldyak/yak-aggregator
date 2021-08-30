const { ethers } = require("hardhat")
const { expect } = require("chai")

async function checkTokenCountValidity(poolAddress, expectedTknCount) {
	let curvelikePool = await ethers.getContractAt('ICurveLikePool', poolAddress)
	try {
		// Check that max of expected-token-count is valid
		await expect(curvelikePool.getToken(expectedTknCount-1)).to.not.reverted
		// Check that there are not tokens after the expected-token-count
		await expect(curvelikePool.getToken(expectedTknCount)).to.reverted
	} catch (e) {
		throw new Error(`Invalid token-count for pool ${poolAddress}`)
	}
}

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()

    const NAME = 'GondolaETHYakAdapterV0'
    const POOL = '0xed986f982269e0319F710EC270875dE2b2A443d2'  // GondolaETH pool
    const TOKEN_COUNT = 2
    const GAS_ESTIMATE = 280000

    // Check that `TOKEN_COUNT` is valid
    await checkTokenCountValidity(POOL, TOKEN_COUNT)

    log(`GondolaETHYakAdapterV0`)
    const deployResult = await deploy("GondolaETHYakAdapterV0", {
      from: deployer,
      contract: "CurveLikeAdapter",
      gas: 4000000,
      args: [
          NAME,
          POOL, 
		      TOKEN_COUNT,
          GAS_ESTIMATE
      ],
      skipIfAlreadyDeployed: true
    })
  
    if (deployResult.newlyDeployed) {
      log(`- ${deployResult.contractName} deployed at ${deployResult.address} using ${deployResult.receipt.gasUsed} gas`)
    } else {
      log(`- Deployment skipped, using previous deployment at: ${deployResult.address}`)
    }
  }

  module.exports.tags = ['V0', 'adapter', 'gondolaETH']