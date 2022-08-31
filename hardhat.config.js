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

const verifyContract = require("./src/scripts/verify-contract");
const { task } = require("hardhat/config");

// to verify all contracts use
// find ./deployments/mainnet -maxdepth 1 -type f -not -path '*/\.*' -path "*.json" | xargs -L1 npx hardhat verifyContract --deployment-file-path --network mainnet
task("verifyContract", "Verifies the contract in the snowtrace")
  .addParam("deploymentFilePath", "Deployment file path")
  .setAction(
    async({deploymentFilePath}, hre) => verifyContract(deploymentFilePath, hre)
  )

// npx hardhat list-adapters --network mainnet
task("list-adapters", "Lists all adapters for the current YakRouter", async (_, hre) => {
  const YakRouter = await hre.ethers.getContract("YakRouterV0")
  const adapterLen = await YakRouter.adaptersCount()
  const adapterIndices = Array.from(Array(adapterLen.toNumber()).keys())
  const liveAdapters = await Promise.all(adapterIndices.map(async (i) => {
      const adapter = await YakRouter.ADAPTERS(i)
      const name = await hre.ethers.getContractAt("YakAdapter", adapter)
        .then(a => a.name())
      return { adapter, name }
  }))
  console.table(liveAdapters)
})

function getEnvValSafe(key, required=true) {
  const endpoint = process.env[key];
  if (!endpoint && required)
      throw(`Missing env var ${key}`);
  return endpoint
}

const AVALANCHE_RPC = getEnvValSafe('AVALANCHE_RPC')
const ARBITRUM_RPC = getEnvValSafe('ARBITRUM_RPC')
const AVALANCHE_PK_DEPLOYER = getEnvValSafe('AVALANCHE_PK_DEPLOYER')
const ARBITRUM_PK_DEPLOYER = getEnvValSafe('ARBITRUM_PK_DEPLOYER')
const ETHERSCAN_API_KEY = getEnvValSafe('ETHERSCAN_API_KEY', false)


module.exports = {
  mocha: {
    timeout: 1e6,
    recursive: true,
    spec: ['test/*.spec.js']
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
  etherscan: {
    apiKey: ETHERSCAN_API_KEY
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
      gasPrice: 225000000000,
      url: AVALANCHE_RPC,
      accounts: [ AVALANCHE_PK_DEPLOYER ]
    },
    arbitrum: {
      chainId: 42161,
      url: ARBITRUM_RPC,
      accounts: [ ARBITRUM_PK_DEPLOYER ],
    },
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
