require('dotenv').config();
require("@nomiclabs/hardhat-waffle");
require('hardhat-contract-sizer');
require('hardhat-deploy-ethers');
require('hardhat-abi-exporter');
require("hardhat-gas-reporter");
require("hardhat-tracer");
require('hardhat-deploy');

if (!process.env.AVALANCHE_FORK_RPC) {
  throw new Error('Fork RPC provider not defined')
}
const AVALANCHE_FORK_RPC = process.env.AVALANCHE_FORK_RPC
if (!process.env.PK_DEPLOYER) {
  console.log('WARNING: Missing private-key for deployer - cant deploy')
}
if (!process.env.AVALANCHE_DEPLOY_RPC) {
  console.log('WARNING: Missing RPC provider for deployer')
}
const PK_DEPLOYER = process.env.PK_DEPLOYER || "1111111111111111111111111111111111111111111111111111111111"
const AVALANCHE_DEPLOY_RPC = process.env.AVALANCHE_DEPLOY_RPC || process.env.AVALANCHE_FORK_RPC

module.exports = {
  mocha: {
    timeout: 1e6,
    recursive: true,
    spec: ['test/**/*.spec.js']
  },
  solidity: {
      version: "0.7.6", 
      settings: {
        optimizer: {
          enabled: true,
          runs: 999
        }  
      }
  },
  namedAccounts: {
    deployer: {
      default: 0,
    }
  },
  defaultNetwork: 'hardhat',
  networks: {
    hardhat: {
      chainId: 43114,
      forking: {
        url: AVALANCHE_FORK_RPC, 
        blockNumber: 8100181
      },
      accounts: {
        accountsBalance: "10000000000000000000000000", 
        count: 200
      }
    }, 
    mainnet: {
      chainId: 43114,
      gasPrice: 225000000000,
      url: AVALANCHE_DEPLOY_RPC,
      accounts: [
        PK_DEPLOYER
      ]
    }
  },
  paths: {
    deploy: 'deploy',
    deployments: 'deployments'
  },
  abiExporter: {
    path: './abis',
    clear: true,
    flat: true
  },
  contractSizer: {
    alphaSort: false,
    runOnCompile: false,
    disambiguatePaths: false,
  },
  gasReporter: {
    enabled: false,
    showTimeSpent: true, 
    gasPrice: 225
  }
};
