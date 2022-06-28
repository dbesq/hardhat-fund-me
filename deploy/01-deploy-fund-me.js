//  DEPLOY FUNDME
const { network } = require("hardhat")
const { networkConfig, developmentChains } = require("../helper-hardhat-config")

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, get, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId
    const { verify } = require("../utils/verify")

    // If chain is X, use address Y
    // const ethUsdPriceFeedAddress = networkConfig[chainId]['ethUsdPriceFeed']

    let ethUsdPriceFeedAddress

    // If on local dev chain, use mock
    // Else, use price feed address for network per its chainId from helper-hardhat-config.js
    if (developmentChains.includes(network.name)) {
        const ethUsdAggregator = await get("MockV3Aggregator")
        ethUsdPriceFeedAddress = ethUsdAggregator.address
    } else {
        ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"]
    }

    // If not priceFeed contract, deploy a mini-version 'mock'
    // What if we want to change chains?
    // When going for localhost or hardhat network, we want to use a mock
    const args = [ethUsdPriceFeedAddress]
    const fundMe = await deploy("FundMe", {
        from: deployer,
        args: args, // price feed address
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1, // if not in hardhat.config, use 1 block instead of .wait(1)
    })

    // Verify
    if (
        !developmentChains.includes(network.name) &&
        process.env.ETHERSCAN_API_KEY
    ) {
        await verify(fundMe.address, args)
    }

    log("-------------------------------------------")
}

module.exports.tags = ["all", "fundme"]
