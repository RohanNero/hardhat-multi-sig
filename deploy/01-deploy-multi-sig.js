const { getNamedAccounts, deployments, network, run, ethers } = require("hardhat")
const { networkConfig, developmentChains } = require("../helper-hardhat.config")
const { verify } = require("../utils/verify.js")

module.exports = async function ({ deployments, getNamedAccounts }) {
    const { deploy, log } = deployments
    const { deployer, owner2, owner3 } = await getNamedAccounts()
    console.log(deployer)
    const chainId = network.config.chainId
    let owners, confirmationsRequired
    if (chainId == 31337) {
        owners = [deployer, owner2, owner3]
        confirmationsRequired = 2
    } else {
        owners = [
            "0xe4a98d2bfd66ce08128fdfffc9070662e489a28e",
            "0xac3d5989f52890fd15d5f3108601884e649d7b2b",
            "0x8423cc45c78ad4b0911ee3b6f03204ac9d6a57fb",
        ]
        //owners = networkConfig[chainId].owners
        confirmationsRequired = networkConfig[chainId].confirmationsRequired
    }
    //console.log(`First owner: ${owners[0]}`)
    //console.log(`Owners array: ${owners}`)
    //console.log(`confirmationsRequired: ${confirmationsRequired}`)
    args = [owners, confirmationsRequired]
    //console.log(deployer)
    //console.log(args)
    //console.log("Deploying multi sig...")
    const multiSig = await deploy("MultiSig", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: 1,
    })
    //console.log("Deployed!")

    if (
        !developmentChains.includes(network.name) &&
        process.env.ETHERSCAN_API_KEY
    ) {
        await verify(multiSig.address, args)
    }
}
