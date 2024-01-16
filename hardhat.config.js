require('dotenv').config();
require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-waffle");
require('hardhat-contract-sizer');
require('hardhat-deploy-ethers');
require('hardhat-abi-exporter');
require("hardhat-gas-reporter");
require('hardhat-log-remover');
require("hardhat-tracer");
require('hardhat-deploy');

// Tasks
require('./src/tasks/update-hop-tokens')
require('./src/tasks/update-adapters')
require('./src/tasks/verify-contract')
require('./src/tasks/find-best-path')
require('./src/tasks/find-best-path-wrapped')
require('./src/tasks/list-adapters')

const AVALANCHE_RPC = getEnvValSafe('AVALANCHE_RPC')
const FUJI_RPC = getEnvValSafe('FUJI_RPC')
const ARBITRUM_RPC = getEnvValSafe('ARBITRUM_RPC')
const OPTIMISM_RPC = getEnvValSafe('OPTIMISM_RPC')
const AURORA_RPC = getEnvValSafe('AURORA_RPC')
const DOGECHAIN_RPC = getEnvValSafe('DOGECHAIN_RPC')
const MANTLE_RPC = getEnvValSafe('MANTLE_RPC')
const AVALANCHE_PK_DEPLOYER = getEnvValSafe('AVALANCHE_PK_DEPLOYER')
const ARBITRUM_PK_DEPLOYER = getEnvValSafe('ARBITRUM_PK_DEPLOYER')
const OPTIMISM_PK_DEPLOYER = getEnvValSafe('OPTIMISM_PK_DEPLOYER')
const AURORA_PK_DEPLOYER = getEnvValSafe('AURORA_PK_DEPLOYER')
const DOGECHAIN_PK_DEPLOYER = getEnvValSafe('DOGECHAIN_PK_DEPLOYER')
const MANTLE_PK_DEPLOYER = getEnvValSafe('MANTLE_PK_DEPLOYER')
const ETHERSCAN_API_KEY = getEnvValSafe('ETHERSCAN_API_KEY', false)

function getEnvValSafe(key, required=true) {
  const endpoint = process.env[key];
  if (!endpoint && required)
      throw(`Missing env var ${key}`);
  return endpoint
}

module.exports = {
  mocha: {
    timeout: 1e6,
    recursive: true,
    spec: ['test/*.spec.js']
  },
  solidity: {
      version: "0.8.4", 
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
  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
    customChains: [
      {
        network: "mantle",
        chainId: 5000,
        urls: {
        apiURL: "https://explorer.mantle.xyz/api",
        browserURL: "https://explorer.mantle.xyz"
        }
      }
    ]
  },
  defaultNetwork: 'hardhat',
  networks: {
    hardhat: {
      chainId: 43114,
      forking: {
        url: AVALANCHE_RPC, 
        blockNumber: 18154644
      },
      accounts: {
        accountsBalance: "10000000000000000000000000", 
        count: 200
      }
    }, 
    avalanche: {
      chainId: 43114,
      url: AVALANCHE_RPC,
      accounts: [ AVALANCHE_PK_DEPLOYER ]
    },
    fuji: {
      chainId: 43113,
      url: FUJI_RPC,
      accounts: [ AVALANCHE_PK_DEPLOYER ],
    },
    arbitrum: {
      chainId: 42161,
      url: ARBITRUM_RPC,
      accounts: [ ARBITRUM_PK_DEPLOYER ],
    },
    optimism: {
      chainId: 10,
      url: OPTIMISM_RPC,
      accounts: [ OPTIMISM_PK_DEPLOYER ],
    },
    aurora: {
      chainId: 1313161554,
      url: AURORA_RPC,
      accounts: [ AURORA_PK_DEPLOYER ],
    },
    dogechain: {
      chainId: 2000,
      url: DOGECHAIN_RPC,
      accounts: [ DOGECHAIN_PK_DEPLOYER ],
    },
    mantle: {
      chainId: 5000,
      url: MANTLE_RPC,
      accounts: [ MANTLE_PK_DEPLOYER ],
    }
  },
  paths: {
    deployments: './src/deployments',
    artifacts: "./src/artifacts",
    sources: "./src/contracts",
    deploy: './src/deploy',
    cache: "./src/cache",
    tests: "./src/test"
  },
  abiExporter: {
    path: './abis',
    clear: true,
    flat: true
  },
  contractSizer: {
    disambiguatePaths: false,
    runOnCompile: false,
    alphaSort: false,
  },
  gasReporter: {
    showTimeSpent: true, 
    enabled: false,
    gasPrice: 225
  }
};
