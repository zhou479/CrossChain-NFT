const { getNamedAccounts, deployments } = require("hardhat")
const { expect } = require("chai");

// prepare variables, contract, account
let firstAccount;
let ccipSimulator, nft, nftPoolLockAndRelease, wnft, nftPoolBurnAndMint, chainSelector;

before(async function() {
    firstAccount = (await getNamedAccounts()).firstAccount;

    await deployments.fixture(["all"]);

    ccipSimulator = await ethers.getContract("CCIPLocalSimulator", firstAccount);
    nft = await ethers.getContract("MyToken", firstAccount);
    nftPoolLockAndRelease = await ethers.getContract("NFTPoolLockAndRelease", firstAccount);
    wnft = await ethers.getContract("WrappedMyToken", firstAccount);
    nftPoolBurnAndMint = await ethers.getContract("NFTPoolBurnAndMint", firstAccount);
    chainSelector = (await ccipSimulator.configuration()).chainSelector_
});

// source chain -> dest chain
describe("source chain -> dest chain", async function() {

    // 1.test if user can mint nft from nft contract successfully
    it("test if user can mint nft from nft contract successfully", async function() {
        await nft.safeMint(firstAccount);
        const owner = await nft.ownerOf(0);
        expect(owner).to.equal(firstAccount);
    });

    // 2.test if user can lock nft in the pool and send ccip message on source chain
    it("test if user can lock nft in the pool and send ccip message on source chain", async function() {
        await ccipSimulator.requestLinkFromFaucet(nftPoolLockAndRelease.target, ethers.parseEther("10"));
        await nft.approve(nftPoolLockAndRelease.target, 0);
        await nftPoolLockAndRelease.lockAndSendNFT(0, firstAccount, chainSelector, nftPoolBurnAndMint.target);
        
        const owner = await nft.ownerOf(0);
        expect(owner).to.equal(nftPoolLockAndRelease);
    });

    // 3.test if user can get wnft in dest chain
    it("test if user can get wnft in dest chain", async function() {
        const owner = await wnft.ownerOf(0);
        expect(owner).to.equal(firstAccount);
    });
})


// dest chain -> source chain
describe("dest chain -> source chain", async function() {
    
    // 4.test if user can burn the wnft and send ccip message on dest chain
    it("test if user can burn the wnft and send ccip message on dest chain", async function() {
        await ccipSimulator.requestLinkFromFaucet(nftPoolLockAndRelease.target, ethers.parseEther("10"));
        await wnft.approve(nftPoolBurnAndMint.target, 0);
        await nftPoolBurnAndMint.burnAndSendNFT(0, firstAccount, chainSelector, nftPoolLockAndRelease.target);
        
        const totalSupply = await wnft.totalSupply();
        expect(totalSupply).to.equal(0);
    })
    // 5.test if user have the nft unlocked on source chain
    it("test if user have the nft unlocked on source chain", async function() {
        const owner = await nft.ownerOf(0);
        expect(owner).to.equal(firstAccount);
    })
})
