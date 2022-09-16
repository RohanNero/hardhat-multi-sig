const developmentChains = ["localhost", "hardhat"];
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
  1: {
    name: "mainnet",
  },
};

module.exports = {
  developmentChains,
  networkConfig,
};
