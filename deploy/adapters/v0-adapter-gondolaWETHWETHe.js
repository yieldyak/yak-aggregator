const { ethers } = require('hardhat')
const { expect } = require('chai')

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments
  const { deployer } = await getNamedAccounts()

  const NAME = 'GondolaWETHWETHeYakAdapterV0'
  const POOL = '0x7408DE8334C03321AFFF953F1318d0B04cdF2601' // Gondola WETH-WETH.e pool
  const GAS_ESTIMATE = 280000

  log(NAME)
  const deployResult = await deploy(NAME, {
    from: deployer,
    contract: 'CurveLikeAdapter',
    gas: 4000000,
    args: [NAME, POOL, GAS_ESTIMATE],
    skipIfAlreadyDeployed: true,
  })

  if (deployResult.newlyDeployed) {
    log(`- ${deployResult.contractName} deployed at ${deployResult.address} using ${deployResult.receipt.gasUsed} gas`)
  } else {
    log(`- Deployment skipped, using previous deployment at: ${deployResult.address}`)
  }
}

module.exports.tags = ['V0', 'adapter', 'gondolaWETHWETHe']
