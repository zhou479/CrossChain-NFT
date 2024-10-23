const { network } = require("hardhat");
const { developmentChains } = require("../helper-hardhat-config");

module.exports = async({getNamedAccounts, deployments}) => {
    if(developmentChains.include(network.name)) {
        const {firstAccount} = await getNamedAccounts();
        const { deploy, log } = deployments;

        log("deploy CCIP Simulator contract");
        await deploy("CCIPLocalSimulator", {
            contract: "CCIPLocalSimulator",
            from: firstAccount,
            log: true,
            args: []
        });
        log("CCIP Simulator contract deployed successfully");
    }
}

module.exports.tags = ["test", "all"];