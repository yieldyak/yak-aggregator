require('dotenv').config();
require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-ethers");
require('hardhat-contract-sizer');
require('hardhat-deploy-ethers');
require('hardhat-abi-exporter');
require("hardhat-gas-reporter");
require("hardhat-tracer");
require('hardhat-deploy');

// load scripts
const aggregatorView = require("./scripts/aggregator-view");

// tasks
task('viewAdapters', 'Displays nice output of all YakAdapters from the YakRouter. With respective Trusted Tokens.')
  .setAction(async () => aggregatorView())


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
        url: process.env.AVALANCHE_MAINNET_URL, 
        // blockNumber: 2000000
      },
      accounts: {
        accountsBalance: "10000000000000000000000000", 
        count: 200
      }
    }, 
    mainnet: {
      chainId: 43114,
      gasPrice: 225000000000,
      url: process.env.AVALANCHE_MAINNET_URL,
      accounts: [
        // process.env.PRIVATE_KEY_5
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
    runOnCompile: true,
    disambiguatePaths: false,
  },
  gasReporter: {
    enabled: true,
    showTimeSpent: true, 
    gasPrice: 225
  }
};
