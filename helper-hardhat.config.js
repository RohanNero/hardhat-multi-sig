const developmentChains = ["localhost", "hardhat"]
const networkConfig = {
    default: {
        name: "hardhat",
    },
    31337: {
        name: "localhost",
    },
    4: {
        name: "rinkeby",
    },
    5: {
        name: "goerli",
        owners: [
            "0xe4A98D2bFD66Ce08128FdFFFC9070662E489a28E",
            "0xac3d5989F52890fd15D5f3108601884E649D7b2b",
            "0x8423cC45C78Ad4B0911eE3b6f03204AC9d6A57FB",
            "0xEC6Cb786Fd27BA1A79809A88A44d3b9A2b06992A",
        ],
        confirmationsRequired: 3,
        blockConfirmations: 7,
    },
    1: {
        name: "mainnet",
    },
}

module.exports = {
    developmentChains,
    networkConfig,
}
