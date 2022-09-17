require("@nomiclabs/hardhat-waffle")
require("@nomiclabs/hardhat-etherscan")
require("hardhat-deploy")
require("solidity-coverage")
require("hardhat-gas-reporter")
require("hardhat-contract-sizer")
require("dotenv").config()

ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY
// RINKEBY_RPC_URL = process.env.RINKEBY_RPC_URL
// RINKEBY_PRIVATE_KEY = process.env.RINKEBY_PRIVATE_KEY
GOERLI_RPC_URL = process.env.GOERLI_RPC_URL
GOERLI_PRIVATE_KEY = process.env.GOERLI_PRIVATE_KEY

module.exports = {
    solidity: "0.8.9",
    defaultNetwork: "hardhat",
    etherscan: {
        apiKey: {
            goerli: ETHERSCAN_API_KEY,
        },
    },
    networks: {
        hardhat: {
            chainId: 31337,
            blockConfirmations: 1,
        },
        localhost: {
            chainId: 31337,
        },
        // rinkeby: {
        //     chainId: 4,
        //     blockConfirmations: 7,
        //     url: RINKEBY_RPC_URL,
        //     account: RINKEBY_PRIVATE_KEY,
        // },
        goerli: {
            chainId: 5,
            blockConfirmations: 7,
            url: GOERLI_RPC_URL,
            accounts:
                GOERLI_PRIVATE_KEY !== undefined ? [GOERLI_PRIVATE_KEY] : [],
        },
    },
    namedAccounts: {
        deployer: {
            1: 0,
            default: 0,
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
