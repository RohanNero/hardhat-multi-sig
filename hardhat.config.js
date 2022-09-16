require("@nomiclabs/hardhat-waffle")
require("@nomiclabs/hardhat-etherscan")
require("hardhat-deploy")
require("solidity-coverage")
require("hardhat-gas-reporter")
require("hardhat-contract-sizer")
require("dotenv").config()

RINKEBY_RPC_URL = process.env.RINKEBY_RPC_URL
RINKEBY_PRIVATE_KEY = process.env.RINKEBY_PRIVATE_KEY

module.exports = {
    solidity: "0.8.9",
    defaultNetwork: "hardhat",
    networks: {
        hardhat: {
            chainId: 31337,
            blockConfirmations: 1,
        },
        localhost: {
            chainId: 31337,
        },
        rinkeby: {
            chainId: 4,
            blockConfirmations: 7,
            url: RINKEBY_RPC_URL,
            account: RINKEBY_PRIVATE_KEY,
        },
    },
    namedAccounts: {
        deployer: {
            31337: 0,
            1: 0,
        },
        owner2: {
            31337: 1,
        },
        owner3: {
            31337: 2,
        },
    },
    gasReporter: {
        enabled: false,
    },
}
