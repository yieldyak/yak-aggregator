const { 
    getTknContractsForNetwork,
    forkGlobalNetwork, 
    getAccountsGen,
    deployContract, 
} = require('../helpers')

const { AdapterTestEnv } = require('./adapter-test-env') 


module.exports.addresses = require('../../misc/addresses.json')
module.exports.constants = require('../../misc/constants.json')
module.exports.helpers = require('../helpers')

module.exports.setTestEnv = async (networkName, forkBlockNum) => {
    await forkGlobalNetwork(forkBlockNum, networkName)
    const supportedTkns = await getTknContractsForNetwork(networkName)
    const accountsGen = await getAccountsGen()
    const deployer = accountsGen.next()
    const testEnv = new TestEnv({supportedTkns, deployer, accountsGen})
    return testEnv
}

class TestEnv {

    constructor({supportedTkns, deployer, accountsGen}) {
        this.supportedTkns = supportedTkns
        this.accountsGen = accountsGen
        this.deployer = deployer
        this.setTrader(accountsGen.next())
    }

    async setAdapterEnv(contractName, args, deployer) {
        deployer = deployer || this.deployer
        const adapter = await deployContract(contractName, { args, deployer })
        return new AdapterTestEnv(this, adapter, deployer)
    }

    updateTrader() {
        this.setTrader(this.nextAccount())
    }

    setTrader(newTrader) {
        this.trader = newTrader
    }

    nextAccount() {
        return this.accountsGen.next()
    }

}