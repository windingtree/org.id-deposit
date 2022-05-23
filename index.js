
const LifDepositContract = require('./build/contracts/LifDeposit.json');
const LifDepositInterfaceContract = require('./build/contracts/LifDepositInterface.json');
const mainConfig = require('./.openzeppelin/main-LifDeposit.json');
const ropstenConfig = require('./.openzeppelin/ropsten-LifDeposit.json');

module.exports = {
    LifDepositContract: LifDepositContract,
    LifDepositInterfaceContract: LifDepositInterfaceContract,
    addresses: {
        main: mainConfig.contract.proxy,
        ropsten: ropstenConfig.contract.proxy,
    }
};

