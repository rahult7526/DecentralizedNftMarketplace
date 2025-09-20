import { expect } from "chai"
import { ethers } from "hardhat"
import { DeNftToken, Marketplace } from "../typechain-types"

describe("Marketplace", function () {
  let nftToken: DeNftToken
  let marketplace: Marketplace
  let owner: any
  let seller: any
  let buyer: any
  let bidder: any

  beforeEach(async function () {
    ;[owner, seller, buyer, bidder] = await ethers.getSigners()

    // Deploy NFT Token
    const DeNftTokenFactory = await ethers.getContractFactory("DeNftToken")
    nftToken = await DeNftTokenFactory.deploy(
      "DeNft Marketplace",
      "DNFT",
      "https://gateway.pinata.cloud/ipfs/",
      "https://gateway.pinata.cloud/ipfs/QmContractMetadata"
    )
    await nftToken.waitForDeployment()

    // Deploy Marketplace
    const MarketplaceFactory = await ethers.getContractFactory("Marketplace")
    marketplace = await MarketplaceFactory.deploy(250) // 2.5% fee
    await marketplace.waitForDeployment()

    // Mint NFT to seller
    await nftToken.mint(seller.address, "https://gateway.pinata.cloud/ipfs/QmTestToken", seller.address, 500)
    
    // Approve marketplace to transfer NFT
    await nftToken.connect(seller).approve(await marketplace.getAddress(), 0)
  })

  describe("Deployment", function () {
    it("Should set the correct marketplace fee", async function () {
      expect(await marketplace.marketplaceFeePercentage()).to.equal(250)
    })

    it("Should have zero active listings initially", async function () {
      expect(await marketplace.getActiveListingsCount()).to.equal(0)
    })
  })

  describe("Fixed Price Listings", function () {
    it("Should create a fixed price listing", async function () {
      const price = ethers.parseEther("1.0")
      
      await expect(
        marketplace.connect(seller).createFixedPriceListing(
          await nftToken.getAddress(),
          0,
          price
        )
      )
        .to.emit(marketplace, "ListingCreated")
        .withArgs(0, await nftToken.getAddress(), 0, seller.address, price, 0, 0)

      const listing = await marketplace.getListing(0)
      expect(listing.id).to.equal(0)
      expect(listing.nftContract).to.equal(await nftToken.getAddress())
      expect(listing.tokenId).to.equal(0)
      expect(listing.seller).to.equal(seller.address)
      expect(listing.price).to.equal(price)
      expect(listing.listingType).to.equal(0) // FixedPrice
      expect(listing.status).to.equal(0) // Active
    })

    it("Should buy a fixed price listing", async function () {
      const price = ethers.parseEther("1.0")
      
      // Create listing
      await marketplace.connect(seller).createFixedPriceListing(
        await nftToken.getAddress(),
        0,
        price
      )

      // Buy listing
      await expect(
        marketplace.connect(buyer).buyFixedPrice(0, { value: price })
      )
        .to.emit(marketplace, "ItemSold")
        .withArgs(0, buyer.address, price, price * 250n / 10000n, 0)

      // Check NFT ownership
      expect(await nftToken.ownerOf(0)).to.equal(buyer.address)
      
      // Check listing status
      const listing = await marketplace.getListing(0)
      expect(listing.status).to.equal(1) // Sold
    })

    it("Should reject buying with wrong price", async function () {
      const price = ethers.parseEther("1.0")
      const wrongPrice = ethers.parseEther("0.5")
      
      // Create listing
      await marketplace.connect(seller).createFixedPriceListing(
        await nftToken.getAddress(),
        0,
        price
      )

      // Try to buy with wrong price
      await expect(
        marketplace.connect(buyer).buyFixedPrice(0, { value: wrongPrice })
      ).to.be.revertedWithCustomError(marketplace, "InvalidPrice")
    })
  })

  describe("Auction Listings", function () {
    it("Should create an auction listing", async function () {
      const startingPrice = ethers.parseEther("0.5")
      const duration = 3600 // 1 hour
      
      await expect(
        marketplace.connect(seller).createAuctionListing(
          await nftToken.getAddress(),
          0,
          startingPrice,
          duration
        )
      )
        .to.emit(marketplace, "ListingCreated")
        .withArgs(0, await nftToken.getAddress(), 0, seller.address, startingPrice, 1, 0)

      const listing = await marketplace.getListing(0)
      expect(listing.listingType).to.equal(1) // Auction
      expect(listing.endTime).to.be.greaterThan(0)
    })

    it("Should place a bid on auction", async function () {
      const startingPrice = ethers.parseEther("0.5")
      const bidAmount = ethers.parseEther("1.0")
      const duration = 3600
      
      // Create auction
      await marketplace.connect(seller).createAuctionListing(
        await nftToken.getAddress(),
        0,
        startingPrice,
        duration
      )

      // Place bid
      await expect(
        marketplace.connect(bidder).placeBid(0, { value: bidAmount })
      )
        .to.emit(marketplace, "BidPlaced")
        .withArgs(0, bidder.address, bidAmount)

      const listing = await marketplace.getListing(0)
      expect(listing.currentBid).to.equal(bidAmount)
      expect(listing.currentBidder).to.equal(bidder.address)
    })

    it("Should reject bid lower than current bid", async function () {
      const startingPrice = ethers.parseEther("0.5")
      const highBid = ethers.parseEther("1.0")
      const lowBid = ethers.parseEther("0.8")
      const duration = 3600
      
      // Create auction
      await marketplace.connect(seller).createAuctionListing(
        await nftToken.getAddress(),
        0,
        startingPrice,
        duration
      )

      // Place high bid
      await marketplace.connect(bidder).placeBid(0, { value: highBid })

      // Try to place lower bid
      await expect(
        marketplace.connect(buyer).placeBid(0, { value: lowBid })
      ).to.be.revertedWithCustomError(marketplace, "BidTooLow")
    })

    it("Should end auction and transfer NFT to highest bidder", async function () {
      const startingPrice = ethers.parseEther("0.5")
      const bidAmount = ethers.parseEther("1.0")
      const duration = 1 // 1 second for testing
      
      // Create auction
      await marketplace.connect(seller).createAuctionListing(
        await nftToken.getAddress(),
        0,
        startingPrice,
        duration
      )

      // Place bid
      await marketplace.connect(bidder).placeBid(0, { value: bidAmount })

      // Wait for auction to end
      await new Promise(resolve => setTimeout(resolve, 2000))

      // End auction
      await expect(
        marketplace.connect(bidder).endAuction(0)
      )
        .to.emit(marketplace, "ItemSold")
        .withArgs(0, bidder.address, bidAmount, bidAmount * 250n / 10000n, 0)

      // Check NFT ownership
      expect(await nftToken.ownerOf(0)).to.equal(bidder.address)
    })
  })

  describe("Listing Management", function () {
    it("Should cancel a listing", async function () {
      const price = ethers.parseEther("1.0")
      
      // Create listing
      await marketplace.connect(seller).createFixedPriceListing(
        await nftToken.getAddress(),
        0,
        price
      )

      // Cancel listing
      await expect(
        marketplace.connect(seller).cancelListing(0)
      )
        .to.emit(marketplace, "ListingCancelled")
        .withArgs(0)

      // Check NFT ownership (should be back to seller)
      expect(await nftToken.ownerOf(0)).to.equal(seller.address)
      
      // Check listing status
      const listing = await marketplace.getListing(0)
      expect(listing.status).to.equal(2) // Cancelled
    })

    it("Should reject cancellation by non-owner", async function () {
      const price = ethers.parseEther("1.0")
      
      // Create listing
      await marketplace.connect(seller).createFixedPriceListing(
        await nftToken.getAddress(),
        0,
        price
      )

      // Try to cancel by non-owner
      await expect(
        marketplace.connect(buyer).cancelListing(0)
      ).to.be.revertedWithCustomError(marketplace, "NotListingOwner")
    })
  })

  describe("Fee Management", function () {
    it("Should update marketplace fee", async function () {
      const newFee = 500 // 5%
      
      await expect(
        marketplace.setMarketplaceFee(newFee)
      )
        .to.emit(marketplace, "MarketplaceFeeUpdated")
        .withArgs(newFee)

      expect(await marketplace.marketplaceFeePercentage()).to.equal(newFee)
    })

    it("Should reject invalid marketplace fee", async function () {
      const invalidFee = 1500 // 15% - too high
      
      await expect(
        marketplace.setMarketplaceFee(invalidFee)
      ).to.be.revertedWithCustomError(marketplace, "InvalidMarketplaceFee")
    })
  })
})

