require('dotenv').config();
require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-waffle");
require('hardhat-contract-sizer');
require('hardhat-deploy-ethers');
require('hardhat-abi-exporter');
require("hardhat-gas-reporter");
require('hardhat-log-remover');
require('hardhat-deploy');
require("hardhat-tracer");
require("@matterlabs/hardhat-zksync-deploy");
require("@matterlabs/hardhat-zksync-solc");
require("@matterlabs/hardhat-zksync-toolbox");
require("@matterlabs/hardhat-zksync-verify");


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
const ZKSYNC_RPC = getEnvValSafe('ZKSYNC_RPC')
const ZKSYNC_VERIFY_URL = getEnvValSafe('ZKSYNC_VERIFY_URL')
const ETHEREUM_MAINNET_RPC = getEnvValSafe('ETHEREUM_MAINNET_RPC')
const AVALANCHE_PK_DEPLOYER = getEnvValSafe('AVALANCHE_PK_DEPLOYER')
const ARBITRUM_PK_DEPLOYER = getEnvValSafe('ARBITRUM_PK_DEPLOYER')
const OPTIMISM_PK_DEPLOYER = getEnvValSafe('OPTIMISM_PK_DEPLOYER')
const AURORA_PK_DEPLOYER = getEnvValSafe('AURORA_PK_DEPLOYER')
const DOGECHAIN_PK_DEPLOYER = getEnvValSafe('DOGECHAIN_PK_DEPLOYER')
const ZKSYNC_PK_DEPLOYER = getEnvValSafe("ZKSYNC_PK_DEPLOYER")
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
  zksolc: {
    version: "1.3.8",
    compilerSource: "binary",
    settings: {},
  },
  namedAccounts: {
    deployer: {
      default: 0,
    }
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY
  },
  defaultNetwork: 'hardhat',
  networks: {
    hardhat: {
      zksync: false,
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
      zksync: false,
      chainId: 43114,
      gasPrice: 225000000000,
      url: AVALANCHE_RPC,
      accounts: [ AVALANCHE_PK_DEPLOYER ]
    },
    fuji: {
      zksync: false,
      chainId: 43113,
      url: FUJI_RPC,
      accounts: [ AVALANCHE_PK_DEPLOYER ],
    },
    arbitrum: {
      zksync: false,
      chainId: 42161,
      url: ARBITRUM_RPC,
      accounts: [ ARBITRUM_PK_DEPLOYER ],
    },
    optimism: {
      zksync: false,
      chainId: 10,
      url: OPTIMISM_RPC,
      accounts: [ OPTIMISM_PK_DEPLOYER ],
    },
    aurora: {
      zksync: false,
      chainId: 1313161554,
      url: AURORA_RPC,
      accounts: [ AURORA_PK_DEPLOYER ],
    },
    dogechain: {
      zksync: false,
      chainId: 2000,
      url: DOGECHAIN_RPC,
      accounts: [ DOGECHAIN_PK_DEPLOYER ],
    },
    zksync: {
      zksync: true,
      chainId: 324,
      url: ZKSYNC_RPC,
      ethNetwork: ETHEREUM_MAINNET_RPC,
      accounts: [ ZKSYNC_PK_DEPLOYER ],
      verifyURL: ZKSYNC_VERIFY_URL,
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
