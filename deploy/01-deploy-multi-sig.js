const { network } = require("hardhat")
const { networkConfig } = require("../helper-hardhat.config")

module.exports = async function({deployments, getNamedAccounts}) {
    const { deploy, log } = deployments
    const { deployer, owner2, owner3 } = await getNamedAccounts()
    const chainId = network.config.chainId
    let owners, confirmationsRequired
    if (chainId == 31337) {
        owners = [deployer, owner2, owner3]
        confirmationsRequired = 2       
    } else {
        owners = networkConfig[chainId].owners
        confirmationsRequired = networkConfig[chainId].confirmationsRequired
    }
    console.log(`Owners array: ${owners}`)
    console.log(`confirmationsRequired: ${confirmationsRequired}`)
    args = [owners, confirmationsRequired]
    
    const multiSig = await deploy("MultiSig", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: networkConfig[chainId].blockConfirmations
    })
}