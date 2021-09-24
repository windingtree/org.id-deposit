require('@nomiclabs/hardhat-ethers');
require('@nomiclabs/hardhat-etherscan');

module.exports = {

    networks: {
        mainnet: {
            url: 'https://mainnet.infura.io/v3/',
            accounts: []
        }
    },

    etherscan: {
        apiKey: ''
    },
    solidity: {
        compilers: [
            {
                version: '0.5.16',
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 200
                    }
                }
            }
        ]
    },
};