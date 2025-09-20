import { expect } from "chai";
import { ethers } from "hardhat";
import { DeNftToken, NFTMarketplace } from "../typechain-types";

describe("NFTMarketplace", function () {
  let nftToken: DeNftToken;
  let marketplace: NFTMarketplace;
  let owner: any;
  let seller: any;
  let buyer: any;
  let bidder1: any;
  let bidder2: any;

  beforeEach(async function () {
    [owner, seller, buyer, bidder1, bidder2] = await ethers.getSigners();

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

    // Mint NFT to seller
    await nftToken.mint(seller.address, "https://gateway.pinata.cloud/ipfs/QmTestToken");
    
    // Approve marketplace to transfer NFT
    await nftToken.connect(seller).approve(await marketplace.getAddress(), 0);
  });

  describe("Deployment", function () {
    it("Should set the correct marketplace fee", async function () {
      expect(await marketplace.marketplaceFeePercentage()).to.equal(250);
    });

    it("Should have zero active listings initially", async function () {
      const activeListings = await marketplace.getActiveListings();
      expect(activeListings.length).to.equal(0);
    });

    it("Should have zero active auctions initially", async function () {
      const activeAuctions = await marketplace.getActiveAuctions();
      expect(activeAuctions.length).to.equal(0);
    });
  });

  describe("Fixed Price Listings", function () {
    let listingId: string;

    beforeEach(async function () {
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
    });

    it("Should create a listing", async function () {
      const listing = await marketplace.getListing(listingId);
      expect(listing.nftContract).to.equal(await nftToken.getAddress());
      expect(listing.tokenId).to.equal(0);
      expect(listing.seller).to.equal(seller.address);
      expect(listing.price).to.equal(ethers.parseEther("1.0"));
      expect(listing.isActive).to.be.true;

      const activeListings = await marketplace.getActiveListings();
      expect(activeListings.length).to.equal(1);
      expect(activeListings[0]).to.equal(listingId);
    });

    it("Should buy a listed item", async function () {
      const price = ethers.parseEther("1.0");
      const marketplaceFee = price * 250n / 10000n; // 2.5%
      const sellerProceeds = price - marketplaceFee;

      await expect(
        marketplace.connect(buyer).buyNow(listingId, { value: price })
      )
        .to.emit(marketplace, "ItemBought")
        .withArgs(listingId, buyer.address, price, marketplaceFee);

      // Check NFT ownership
      expect(await nftToken.ownerOf(0)).to.equal(buyer.address);

      // Check seller proceeds
      expect(await marketplace.getProceeds(seller.address)).to.equal(sellerProceeds);

      // Check listing is no longer active
      const listing = await marketplace.getListing(listingId);
      expect(listing.isActive).to.be.false;

      const activeListings = await marketplace.getActiveListings();
      expect(activeListings.length).to.equal(0);
    });

    it("Should reject buying with wrong price", async function () {
      const wrongPrice = ethers.parseEther("0.5");

      await expect(
        marketplace.connect(buyer).buyNow(listingId, { value: wrongPrice })
      ).to.be.revertedWithCustomError(marketplace, "InvalidPrice");
    });

    it("Should cancel a listing", async function () {
      await expect(
        marketplace.connect(seller).cancelListing(listingId)
      )
        .to.emit(marketplace, "ListingCancelled")
        .withArgs(listingId);

      // Check NFT ownership (should be back to seller)
      expect(await nftToken.ownerOf(0)).to.equal(seller.address);

      // Check listing is no longer active
      const listing = await marketplace.getListing(listingId);
      expect(listing.isActive).to.be.false;

      const activeListings = await marketplace.getActiveListings();
      expect(activeListings.length).to.equal(0);
    });

    it("Should reject cancellation by non-owner", async function () {
      await expect(
        marketplace.connect(buyer).cancelListing(listingId)
      ).to.be.revertedWithCustomError(marketplace, "NotListingOwner");
    });
  });

  describe("Auctions", function () {
    let auctionId: string;

    beforeEach(async function () {
      // Create an auction
      const tx = await marketplace.connect(seller).createAuction(
        await nftToken.getAddress(),
        0,
        ethers.parseEther("0.5"),
        3600 // 1 hour
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

    it("Should create an auction", async function () {
      const auction = await marketplace.getAuction(auctionId);
      expect(auction.nftContract).to.equal(await nftToken.getAddress());
      expect(auction.tokenId).to.equal(0);
      expect(auction.seller).to.equal(seller.address);
      expect(auction.startingBid).to.equal(ethers.parseEther("0.5"));
      expect(auction.isActive).to.be.true;
      expect(auction.isFinalized).to.be.false;

      const activeAuctions = await marketplace.getActiveAuctions();
      expect(activeAuctions.length).to.equal(1);
      expect(activeAuctions[0]).to.equal(auctionId);
    });

    it("Should place bids on auction", async function () {
      const bid1 = ethers.parseEther("1.0");
      const bid2 = ethers.parseEther("1.5");

      // First bid
      await expect(
        marketplace.connect(bidder1).placeBid(auctionId, { value: bid1 })
      )
        .to.emit(marketplace, "BidPlaced")
        .withArgs(auctionId, bidder1.address, bid1);

      let auction = await marketplace.getAuction(auctionId);
      expect(auction.highestBid).to.equal(bid1);
      expect(auction.highestBidder).to.equal(bidder1.address);

      // Second bid (higher)
      await expect(
        marketplace.connect(bidder2).placeBid(auctionId, { value: bid2 })
      )
        .to.emit(marketplace, "BidPlaced")
        .withArgs(auctionId, bidder2.address, bid2);

      auction = await marketplace.getAuction(auctionId);
      expect(auction.highestBid).to.equal(bid2);
      expect(auction.highestBidder).to.equal(bidder2.address);

      // Check that first bidder got refunded
      expect(await marketplace.getProceeds(bidder1.address)).to.equal(bid1);
    });

    it("Should reject bid lower than current highest bid", async function () {
      const highBid = ethers.parseEther("1.0");
      const lowBid = ethers.parseEther("0.8");

      // Place high bid
      await marketplace.connect(bidder1).placeBid(auctionId, { value: highBid });

      // Try to place lower bid
      await expect(
        marketplace.connect(bidder2).placeBid(auctionId, { value: lowBid })
      ).to.be.revertedWithCustomError(marketplace, "BidTooLow");
    });

    it("Should end auction and transfer NFT to highest bidder", async function () {
      const bidAmount = ethers.parseEther("1.0");
      const marketplaceFee = bidAmount * 250n / 10000n; // 2.5%
      const sellerProceeds = bidAmount - marketplaceFee;

      // Place bid
      await marketplace.connect(bidder1).placeBid(auctionId, { value: bidAmount });

      // Fast forward time to end auction
      await ethers.provider.send("evm_increaseTime", [3601]); // 1 hour + 1 second
      await ethers.provider.send("evm_mine", []);

      // End auction
      await expect(
        marketplace.connect(bidder1).endAuction(auctionId)
      )
        .to.emit(marketplace, "AuctionFinalized")
        .withArgs(auctionId, bidder1.address, bidAmount, marketplaceFee);

      // Check NFT ownership
      expect(await nftToken.ownerOf(0)).to.equal(bidder1.address);

      // Check seller proceeds
      expect(await marketplace.getProceeds(seller.address)).to.equal(sellerProceeds);

      // Check auction is finalized
      const auction = await marketplace.getAuction(auctionId);
      expect(auction.isFinalized).to.be.true;
      expect(auction.isActive).to.be.false;

      const activeAuctions = await marketplace.getActiveAuctions();
      expect(activeAuctions.length).to.equal(0);
    });

    it("Should end auction with no bids and return NFT to seller", async function () {
      // Fast forward time to end auction
      await ethers.provider.send("evm_increaseTime", [3601]); // 1 hour + 1 second
      await ethers.provider.send("evm_mine", []);

      // End auction
      await expect(
        marketplace.connect(seller).endAuction(auctionId)
      )
        .to.emit(marketplace, "AuctionFinalized")
        .withArgs(auctionId, ethers.ZeroAddress, 0, 0);

      // Check NFT ownership (should be back to seller)
      expect(await nftToken.ownerOf(0)).to.equal(seller.address);
    });

    it("Should reject ending auction before it ends", async function () {
      await expect(
        marketplace.connect(seller).endAuction(auctionId)
      ).to.be.revertedWithCustomError(marketplace, "AuctionNotEnded");
    });
  });

  describe("Proceeds Withdrawal", function () {
    it("Should allow sellers to withdraw proceeds", async function () {
      // Create and buy a listing to generate proceeds
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
      const listingId = marketplace.interface.parseLog(event!).args.listingId;

      // Buy the listing
      await marketplace.connect(buyer).buyNow(listingId, { value: ethers.parseEther("1.0") });

      const proceeds = await marketplace.getProceeds(seller.address);
      expect(proceeds).to.be.gt(0);

      // Withdraw proceeds
      const initialBalance = await ethers.provider.getBalance(seller.address);
      
      await expect(
        marketplace.connect(seller).withdrawProceeds()
      )
        .to.emit(marketplace, "ProceedsWithdrawn")
        .withArgs(seller.address, proceeds);

      const finalBalance = await ethers.provider.getBalance(seller.address);
      expect(finalBalance).to.be.gt(initialBalance);

      // Check proceeds are zero after withdrawal
      expect(await marketplace.getProceeds(seller.address)).to.equal(0);
    });

    it("Should reject withdrawal with no proceeds", async function () {
      await expect(
        marketplace.connect(seller).withdrawProceeds()
      ).to.be.revertedWithCustomError(marketplace, "NoBids");
    });
  });

  describe("Fee Management", function () {
    it("Should update marketplace fee", async function () {
      const newFee = 500; // 5%
      
      await expect(
        marketplace.setMarketplaceFee(newFee)
      )
        .to.emit(marketplace, "MarketplaceFeeUpdated")
        .withArgs(newFee);

      expect(await marketplace.marketplaceFeePercentage()).to.equal(newFee);
    });

    it("Should reject invalid marketplace fee", async function () {
      const invalidFee = 1500; // 15% - too high
      
      await expect(
        marketplace.setMarketplaceFee(invalidFee)
      ).to.be.revertedWithCustomError(marketplace, "InvalidMarketplaceFee");
    });
  });

  describe("Pausing", function () {
    it("Should pause and unpause correctly", async function () {
      await marketplace.pause();
      expect(await marketplace.paused()).to.be.true;

      await marketplace.unpause();
      expect(await marketplace.paused()).to.be.false;
    });

    it("Should not allow listing when paused", async function () {
      await marketplace.pause();
      
      await expect(
        marketplace.connect(seller).listItem(
          await nftToken.getAddress(),
          0,
          ethers.parseEther("1.0")
        )
      ).to.be.revertedWithCustomError(marketplace, "EnforcedPause");
    });
  });

  describe("Security", function () {
    it("Should prevent listing same NFT twice", async function () {
      // First listing
      await marketplace.connect(seller).listItem(
        await nftToken.getAddress(),
        0,
        ethers.parseEther("1.0")
      );

      // Mint another NFT to seller
      await nftToken.mint(seller.address, "https://gateway.pinata.cloud/ipfs/QmTestToken2");
      await nftToken.connect(seller).approve(await marketplace.getAddress(), 1);

      // Try to list same NFT again (should fail)
      await expect(
        marketplace.connect(seller).listItem(
          await nftToken.getAddress(),
          0,
          ethers.parseEther("2.0")
        )
      ).to.be.revertedWithCustomError(marketplace, "NFTAlreadyListed");
    });

    it("Should prevent auctioning already listed NFT", async function () {
      // Create listing
      await marketplace.connect(seller).listItem(
        await nftToken.getAddress(),
        0,
        ethers.parseEther("1.0")
      );

      // Try to create auction for same NFT
      await expect(
        marketplace.connect(seller).createAuction(
          await nftToken.getAddress(),
          0,
          ethers.parseEther("0.5"),
          3600
        )
      ).to.be.revertedWithCustomError(marketplace, "NFTAlreadyListed");
    });
  });

  describe("Integration Flow", function () {
    it("Should complete full flow: mint → approve → list → buy", async function () {
      // Mint NFT
      await nftToken.mint(seller.address, "https://gateway.pinata.cloud/ipfs/QmTestToken");
      
      // Approve marketplace
      await nftToken.connect(seller).approve(await marketplace.getAddress(), 0);
      
      // List item
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
      const listingId = marketplace.interface.parseLog(event!).args.listingId;
      
      // Buy item
      await marketplace.connect(buyer).buyNow(listingId, { value: ethers.parseEther("1.0") });
      
      // Verify NFT ownership
      expect(await nftToken.ownerOf(0)).to.equal(buyer.address);
    });

    it("Should complete full auction flow: mint → approve → auction → bid → finalize", async function () {
      // Mint NFT
      await nftToken.mint(seller.address, "https://gateway.pinata.cloud/ipfs/QmTestToken");
      
      // Approve marketplace
      await nftToken.connect(seller).approve(await marketplace.getAddress(), 0);
      
      // Create auction
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
      const auctionId = marketplace.interface.parseLog(event!).args.auctionId;
      
      // Place bid
      await marketplace.connect(bidder1).placeBid(auctionId, { value: ethers.parseEther("1.0") });
      
      // End auction
      await ethers.provider.send("evm_increaseTime", [3601]);
      await ethers.provider.send("evm_mine", []);
      await marketplace.connect(bidder1).endAuction(auctionId);
      
      // Verify NFT ownership
      expect(await nftToken.ownerOf(0)).to.equal(bidder1.address);
    });
  });
});
