import { expect } from "chai";
import { ethers } from "hardhat";
import { DeNftToken, NFTMarketplace } from "../typechain-types";

describe("Security Tests", function () {
  let nftToken: DeNftToken;
  let marketplace: NFTMarketplace;
  let owner: any;
  let seller: any;
  let buyer: any;
  let attacker: any;

  beforeEach(async function () {
    [owner, seller, buyer, attacker] = await ethers.getSigners();

    // Deploy NFT Token
    const DeNftTokenFactory = await ethers.getContractFactory("DeNftToken");
    nftToken = await DeNftTokenFactory.deploy(
      "DeNft Marketplace",
      "DNFT",
      "https://gateway.pinata.cloud/ipfs/"
    );
    await nftToken.waitForDeployment();

    // Deploy Marketplace
    const MarketplaceFactory = await ethers.getContractFactory("NFTMarketplace");
    marketplace = await MarketplaceFactory.deploy(250); // 2.5% fee
    await marketplace.waitForDeployment();
  });

  describe("Reentrancy Protection", function () {
    let listingId: string;
    let auctionId: string;

    beforeEach(async function () {
      // Mint NFT to seller
      await nftToken.mint(seller.address, "https://gateway.pinata.cloud/ipfs/QmTestToken1");
      await nftToken.connect(seller).approve(await marketplace.getAddress(), 0);

      // Create a listing
      const tx = await marketplace.connect(seller).listItem(
        await nftToken.getAddress(),
        0,
        ethers.parseEther("1.0")
      );
      const receipt = await tx.wait();
      const event = receipt?.logs.find(log => {
        try {
          const parsed = marketplace.interface.parseLog(log);
          return parsed?.name === "ItemListed";
        } catch {
          return false;
        }
      });
      listingId = marketplace.interface.parseLog(event!).args.listingId;

      // Mint second NFT for auction
      await nftToken.mint(seller.address, "https://gateway.pinata.cloud/ipfs/QmTestToken2");
      await nftToken.connect(seller).approve(await marketplace.getAddress(), 1);

      // Create an auction
      const auctionTx = await marketplace.connect(seller).createAuction(
        await nftToken.getAddress(),
        1,
        ethers.parseEther("0.5"),
        3600
      );
      const auctionReceipt = await auctionTx.wait();
      const auctionEvent = auctionReceipt?.logs.find(log => {
        try {
          const parsed = marketplace.interface.parseLog(log);
          return parsed?.name === "AuctionCreated";
        } catch {
          return false;
        }
      });
      auctionId = marketplace.interface.parseLog(auctionEvent!).args.auctionId;
    });

    it("Should prevent reentrancy during buyNow", async function () {
      // Deploy malicious contract that attempts reentrancy
      const MaliciousContract = await ethers.getContractFactory("MaliciousBuyer");
      const maliciousContract = await MaliciousContract.deploy();
      await maliciousContract.waitForDeployment();

      // Fund malicious contract
      await attacker.sendTransaction({
        to: await maliciousContract.getAddress(),
        value: ethers.parseEther("2.0")
      });

      // Set target marketplace and listing
      await maliciousContract.setTarget(await marketplace.getAddress(), listingId);

      // Attempt reentrancy attack - should fail
      await expect(
        maliciousContract.attack()
      ).to.be.revertedWithCustomError(marketplace, "ReentrancyGuardReentrantCall");
    });

    it("Should prevent reentrancy during auction bid", async function () {
      // Deploy malicious contract for auction attack
      const MaliciousAuctionBidder = await ethers.getContractFactory("MaliciousAuctionBidder");
      const maliciousContract = await MaliciousAuctionBidder.deploy();
      await maliciousContract.waitForDeployment();

      // Fund malicious contract
      await attacker.sendTransaction({
        to: await maliciousContract.getAddress(),
        value: ethers.parseEther("2.0")
      });

      // Set target marketplace and auction
      await maliciousContract.setTarget(await marketplace.getAddress(), auctionId);

      // Attempt reentrancy attack during bid - should fail
      await expect(
        maliciousContract.attack()
      ).to.be.revertedWithCustomError(marketplace, "ReentrancyGuardReentrantCall");
    });

    it("Should prevent reentrancy during proceeds withdrawal", async function () {
      // First, generate some proceeds by completing a sale
      await marketplace.connect(buyer).buyNow(listingId, { value: ethers.parseEther("1.0") });

      // Deploy malicious contract for withdrawal attack
      const MaliciousWithdrawer = await ethers.getContractFactory("MaliciousWithdrawer");
      const maliciousContract = await MaliciousWithdrawer.deploy();
      await maliciousContract.waitForDeployment();

      // Transfer proceeds to malicious contract (simulate seller using malicious contract)
      const proceeds = await marketplace.getProceeds(seller.address);
      await marketplace.connect(seller).withdrawProceeds();
      
      // Fund malicious contract to simulate having proceeds
      await owner.sendTransaction({
        to: await maliciousContract.getAddress(),
        value: proceeds
      });

      // This test verifies that even if someone tries to use a malicious contract
      // to withdraw proceeds, reentrancy protection would prevent multiple withdrawals
      await maliciousContract.setTarget(await marketplace.getAddress());
      
      // The attack should fail due to reentrancy protection
      await expect(
        maliciousContract.attack()
      ).to.be.revertedWithCustomError(marketplace, "ReentrancyGuardReentrantCall");
    });
  });

  describe("Double Bid Prevention", function () {
    let auctionId: string;

    beforeEach(async function () {
      // Mint NFT and create auction
      await nftToken.mint(seller.address, "https://gateway.pinata.cloud/ipfs/QmTestToken");
      await nftToken.connect(seller).approve(await marketplace.getAddress(), 0);

      const tx = await marketplace.connect(seller).createAuction(
        await nftToken.getAddress(),
        0,
        ethers.parseEther("0.5"),
        3600
      );
      const receipt = await tx.wait();
      const event = receipt?.logs.find(log => {
        try {
          const parsed = marketplace.interface.parseLog(log);
          return parsed?.name === "AuctionCreated";
        } catch {
          return false;
        }
      });
      auctionId = marketplace.interface.parseLog(event!).args.auctionId;
    });

    it("Should prevent same user from bidding twice in same block", async function () {
      // Disable automining to control block generation
      await ethers.provider.send("evm_setAutomine", [false]);

      const bidAmount1 = ethers.parseEther("1.0");
      const bidAmount2 = ethers.parseEther("1.5");

      // Submit two bids in same transaction block
      const tx1 = marketplace.connect(buyer).placeBid(auctionId, { value: bidAmount1 });
      const tx2 = marketplace.connect(buyer).placeBid(auctionId, { value: bidAmount2 });

      // Mine the block
      await ethers.provider.send("evm_mine", []);

      // First transaction should succeed
      await expect(tx1).not.to.be.reverted;

      // Second transaction should fail (attempting to bid twice)
      await expect(tx2).to.be.revertedWithCustomError(marketplace, "BidAlreadyPlaced");

      // Re-enable automining
      await ethers.provider.send("evm_setAutomine", [true]);
    });

    it("Should allow same user to bid again after being outbid", async function () {
      const bidAmount1 = ethers.parseEther("1.0");
      const bidAmount2 = ethers.parseEther("1.5");
      const bidAmount3 = ethers.parseEther("2.0");

      // First bid by buyer
      await marketplace.connect(buyer).placeBid(auctionId, { value: bidAmount1 });

      // Second bid by attacker (outbids buyer)
      await marketplace.connect(attacker).placeBid(auctionId, { value: bidAmount2 });

      // Buyer should be able to bid again after being outbid
      await expect(
        marketplace.connect(buyer).placeBid(auctionId, { value: bidAmount3 })
      ).not.to.be.reverted;

      const auction = await marketplace.getAuction(auctionId);
      expect(auction.highestBidder).to.equal(buyer.address);
      expect(auction.highestBid).to.equal(bidAmount3);
    });
  });

  describe("Buy After Cancel Edge Cases", function () {
    let listingId: string;

    beforeEach(async function () {
      // Mint NFT and create listing
      await nftToken.mint(seller.address, "https://gateway.pinata.cloud/ipfs/QmTestToken");
      await nftToken.connect(seller).approve(await marketplace.getAddress(), 0);

      const tx = await marketplace.connect(seller).listItem(
        await nftToken.getAddress(),
        0,
        ethers.parseEther("1.0")
      );
      const receipt = await tx.wait();
      const event = receipt?.logs.find(log => {
        try {
          const parsed = marketplace.interface.parseLog(log);
          return parsed?.name === "ItemListed";
        } catch {
          return false;
        }
      });
      listingId = marketplace.interface.parseLog(event!).args.listingId;
    });

    it("Should prevent buying cancelled listing", async function () {
      // Cancel the listing
      await marketplace.connect(seller).cancelListing(listingId);

      // Attempt to buy cancelled listing
      await expect(
        marketplace.connect(buyer).buyNow(listingId, { value: ethers.parseEther("1.0") })
      ).to.be.revertedWithCustomError(marketplace, "ListingNotActive");
    });

    it("Should prevent buying already sold listing", async function () {
      // Buy the listing
      await marketplace.connect(buyer).buyNow(listingId, { value: ethers.parseEther("1.0") });

      // Attempt to buy again
      await expect(
        marketplace.connect(attacker).buyNow(listingId, { value: ethers.parseEther("1.0") })
      ).to.be.revertedWithCustomError(marketplace, "ListingNotActive");
    });

    it("Should prevent cancelling already sold listing", async function () {
      // Buy the listing
      await marketplace.connect(buyer).buyNow(listingId, { value: ethers.parseEther("1.0") });

      // Attempt to cancel sold listing
      await expect(
        marketplace.connect(seller).cancelListing(listingId)
      ).to.be.revertedWithCustomError(marketplace, "ListingNotActive");
    });

    it("Should prevent multiple cancellations", async function () {
      // Cancel the listing
      await marketplace.connect(seller).cancelListing(listingId);

      // Attempt to cancel again
      await expect(
        marketplace.connect(seller).cancelListing(listingId)
      ).to.be.revertedWithCustomError(marketplace, "ListingNotActive");
    });
  });

  describe("Auction Edge Cases", function () {
    let auctionId: string;

    beforeEach(async function () {
      // Mint NFT and create auction
      await nftToken.mint(seller.address, "https://gateway.pinata.cloud/ipfs/QmTestToken");
      await nftToken.connect(seller).approve(await marketplace.getAddress(), 0);

      const tx = await marketplace.connect(seller).createAuction(
        await nftToken.getAddress(),
        0,
        ethers.parseEther("0.5"),
        3600
      );
      const receipt = await tx.wait();
      const event = receipt?.logs.find(log => {
        try {
          const parsed = marketplace.interface.parseLog(log);
          return parsed?.name === "AuctionCreated";
        } catch {
          return false;
        }
      });
      auctionId = marketplace.interface.parseLog(event!).args.auctionId;
    });

    it("Should prevent bidding on ended but not finalized auction", async function () {
      // Place initial bid
      await marketplace.connect(buyer).placeBid(auctionId, { value: ethers.parseEther("1.0") });

      // Fast forward past auction end
      await ethers.provider.send("evm_increaseTime", [3601]);
      await ethers.provider.send("evm_mine", []);

      // Attempt to bid on ended auction
      await expect(
        marketplace.connect(attacker).placeBid(auctionId, { value: ethers.parseEther("2.0") })
      ).to.be.revertedWithCustomError(marketplace, "AuctionEnded");
    });

    it("Should prevent finalizing auction multiple times", async function () {
      // Place bid and end auction
      await marketplace.connect(buyer).placeBid(auctionId, { value: ethers.parseEther("1.0") });
      
      // Fast forward time
      await ethers.provider.send("evm_increaseTime", [3601]);
      await ethers.provider.send("evm_mine", []);

      // End auction first time
      await marketplace.connect(buyer).endAuction(auctionId);

      // Attempt to end again
      await expect(
        marketplace.connect(buyer).endAuction(auctionId)
      ).to.be.revertedWithCustomError(marketplace, "AuctionAlreadyFinalized");
    });

    it("Should prevent seller from bidding on their own auction", async function () {
      await expect(
        marketplace.connect(seller).placeBid(auctionId, { value: ethers.parseEther("1.0") })
      ).to.be.revertedWithCustomError(marketplace, "SellerCannotBid");
    });

    it("Should handle edge case where highest bidder tries to end auction early", async function () {
      // Place bid
      await marketplace.connect(buyer).placeBid(auctionId, { value: ethers.parseEther("1.0") });

      // Highest bidder tries to end auction early (should fail)
      await expect(
        marketplace.connect(buyer).endAuction(auctionId)
      ).to.be.revertedWithCustomError(marketplace, "AuctionNotEnded");
    });
  });

  describe("Access Control Edge Cases", function () {
    it("Should prevent non-owner from pausing", async function () {
      await expect(
        marketplace.connect(attacker).pause()
      ).to.be.revertedWithCustomError(marketplace, "OwnableUnauthorizedAccount");
    });

    it("Should prevent operations when paused", async function () {
      // Mint NFT
      await nftToken.mint(seller.address, "https://gateway.pinata.cloud/ipfs/QmTestToken");
      await nftToken.connect(seller).approve(await marketplace.getAddress(), 0);

      // Pause marketplace
      await marketplace.pause();

      // All major operations should fail when paused
      await expect(
        marketplace.connect(seller).listItem(
          await nftToken.getAddress(),
          0,
          ethers.parseEther("1.0")
        )
      ).to.be.revertedWithCustomError(marketplace, "EnforcedPause");

      await expect(
        marketplace.connect(seller).createAuction(
          await nftToken.getAddress(),
          0,
          ethers.parseEther("0.5"),
          3600
        )
      ).to.be.revertedWithCustomError(marketplace, "EnforcedPause");
    });

    it("Should prevent setting invalid marketplace fee", async function () {
      // Test various invalid fees
      const invalidFees = [1001, 1500, 2000]; // Above 10% (1000 basis points)
      
      for (const fee of invalidFees) {
        await expect(
          marketplace.setMarketplaceFee(fee)
        ).to.be.revertedWithCustomError(marketplace, "InvalidMarketplaceFee");
      }
    });
  });

  describe("Integer Overflow/Underflow Protection", function () {
    it("Should handle very large prices correctly", async function () {
      await nftToken.mint(seller.address, "https://gateway.pinata.cloud/ipfs/QmTestToken");
      await nftToken.connect(seller).approve(await marketplace.getAddress(), 0);

      // Test with maximum uint256 value minus fees to prevent overflow
      const maxPrice = ethers.MaxUint256 - ethers.parseEther("1000");
      
      await expect(
        marketplace.connect(seller).listItem(
          await nftToken.getAddress(),
          0,
          maxPrice
        )
      ).not.to.be.reverted;
    });

    it("Should prevent zero price listings", async function () {
      await nftToken.mint(seller.address, "https://gateway.pinata.cloud/ipfs/QmTestToken");
      await nftToken.connect(seller).approve(await marketplace.getAddress(), 0);

      await expect(
        marketplace.connect(seller).listItem(
          await nftToken.getAddress(),
          0,
          0
        )
      ).to.be.revertedWithCustomError(marketplace, "InvalidPrice");
    });
  });

  describe("Gas Limit Edge Cases", function () {
    it("Should handle maximum number of active listings", async function () {
      // Create multiple listings to test gas limits
      const maxListings = 50; // Reasonable limit for testing
      
      for (let i = 0; i < maxListings; i++) {
        await nftToken.mint(seller.address, `https://gateway.pinata.cloud/ipfs/QmTestToken${i}`);
        await nftToken.connect(seller).approve(await marketplace.getAddress(), i);
        
        await marketplace.connect(seller).listItem(
          await nftToken.getAddress(),
          i,
          ethers.parseEther("1.0")
        );
      }

      // Should still be able to query active listings without running out of gas
      const activeListings = await marketplace.getActiveListings();
      expect(activeListings.length).to.equal(maxListings);
    });
  });
});