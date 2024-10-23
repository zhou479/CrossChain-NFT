const { task } = require("hardhat/config");
const { networkConfig } = require("../helper-hardhat-config");

task("lock-and-cross")
    .addOptionalParam("chainselector", "chain selector of dest chain")
    .addOptionalParam("receiver", "receiver address on dest chain")
    .addParam("tokenid", "token ID to be cross chain")
    .setAction(async (taskArgs, hre) => {
        let chainSelector, receiver;
        const tokenId = taskArgs.tokenid;
        const { firstAccount } = await getNamedAccounts();

        if(taskArgs.chainselector) {
            chainSelector = taskArgs.chainselector;
        } else {
            chainSelector = networkConfig[network.config.chainId].companionChainSelector;
            console.log("chainSelector is not set in command");
        }
        console.log(`chainSelector is ${chainSelector}`);

        if(taskArgs.receiver) {
            receiver = taskArgs.receiver;
        } else {
            const nftPoolBurnAndMintDeployment = await hre.companionNetworks["destChain"].deployments.get("NFTPoolBurnAndMint");
            receiver = nftPoolBurnAndMintDeployment.address;
            console.log("receiver is not set in command");
        }
        console.log(`receiver's address is ${receiver}`);

        // transfer link token to the address of pool
        const linkTokenAddress = networkConfig[network.config.chainId].linkToken;
        const linkToken = await ethers.getContractAt("LinkToken", linkTokenAddress);
        const nftPoolLockAndRelease = await ethers.getContract("NFTPoolLockAndRelease", firstAccount);

        // transfer linkToken to pool
        const transferTx = await linkToken.transfer(nftPoolLockAndRelease.target, ethers.parseEther("10"));
        transferTx.wait(6);
        const balance = await linkToken.balanceOf(nftPoolLockAndRelease.target);
        console.log(`balance the pool is ${balance}`);

        // approve pool address to call transferFrom
        const nft = await ethers.getContract("MyToken", firstAccount);
        await nft.approve(nftPoolLockAndRelease.target, tokenId);
        console.log("approve success");

        // call lockAndSendNFT
        const lockAndSendNFTtx = await nftPoolLockAndRelease.lockAndSendNFT(
            tokenId,
            firstAccount,
            chainSelector,
            receiver);
        console.log(`ccip transcation is sent, the tx hash is ${lockAndSendNFTtx.hash}`);
 });

 module.exports = {};