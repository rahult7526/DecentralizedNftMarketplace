import { expect } from "chai";
import { ethers } from "hardhat";
import { DeNftToken } from "../typechain-types";

describe("DeNftToken", function () {
  let nftToken: DeNftToken;
  let owner: any;
  let addr1: any;

  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();

    const DeNftTokenFactory = await ethers.getContractFactory("DeNftToken");
    nftToken = await DeNftTokenFactory.deploy(
      "DeNft Marketplace",
      "DNFT",
      "https://gateway.pinata.cloud/ipfs/"
    );
    await nftToken.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the correct name and symbol", async function () {
      expect(await nftToken.name()).to.equal("DeNft Marketplace");
      expect(await nftToken.symbol()).to.equal("DNFT");
    });

    it("Should set the correct owner", async function () {
      expect(await nftToken.owner()).to.equal(owner.address);
    });
  });

  describe("Minting", function () {
    it("Should mint a new token", async function () {
      const tokenURI = "https://gateway.pinata.cloud/ipfs/QmTestToken";
      
      await expect(nftToken.mint(addr1.address, tokenURI))
        .to.emit(nftToken, "TokenMinted")
        .withArgs(0, addr1.address, tokenURI);

      expect(await nftToken.ownerOf(0)).to.equal(addr1.address);
      expect(await nftToken.tokenURI(0)).to.equal(tokenURI);
    });

    it("Should only allow owner to mint", async function () {
      const tokenURI = "https://gateway.pinata.cloud/ipfs/QmTestToken";
      
      await expect(
        nftToken.connect(addr1).mint(addr1.address, tokenURI)
      ).to.be.revertedWithCustomError(nftToken, "OwnableUnauthorizedAccount");
    });
  });

  describe("Pausing", function () {
    it("Should pause and unpause correctly", async function () {
      await nftToken.pause();
      expect(await nftToken.paused()).to.be.true;

      await nftToken.unpause();
      expect(await nftToken.paused()).to.be.false;
    });

    it("Should not allow minting when paused", async function () {
      await nftToken.pause();
      
      const tokenURI = "https://gateway.pinata.cloud/ipfs/QmTestToken";
      
      await expect(
        nftToken.mint(addr1.address, tokenURI)
      ).to.be.revertedWithCustomError(nftToken, "EnforcedPause");
    });
  });
});