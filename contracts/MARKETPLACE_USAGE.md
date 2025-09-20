# NFTMarketplace Contract Usage Guide

## Overview

The `NFTMarketplace` contract provides a decentralized marketplace for NFT trading with both fixed-price listings and auction capabilities.

## Key Features

- **Fixed Price Listings**: List NFTs for immediate purchase
- **Auctions**: Create time-based auctions with bidding
- **Secure Payments**: Pull payment pattern for security
- **Fee Management**: Configurable marketplace fees
- **Access Control**: Owner controls for critical functions

## Contract Functions

### Listing Functions

#### `listItem(address nftContract, uint256 tokenId, uint256 price)`
Creates a fixed-price listing for an NFT.

**Requirements:**
- Caller must own the NFT
- NFT must be approved for marketplace transfer
- Price must be greater than 0
- NFT cannot already be listed or auctioned

**Example:**
```solidity
// Approve marketplace first
nftToken.approve(marketplaceAddress, tokenId);

// Create listing
marketplace.listItem(nftTokenAddress, tokenId, ethers.parseEther("1.0"));
```

#### `cancelListing(bytes32 listingId)`
Cancels an active listing and returns NFT to seller.

**Requirements:**
- Caller must be the listing owner or contract owner
- Listing must be active

#### `buyNow(bytes32 listingId)`
Purchases a listed NFT immediately.

**Requirements:**
- Listing must be active
- Sent ETH must equal listing price
- Caller must have sufficient ETH

### Auction Functions

#### `createAuction(address nftContract, uint256 tokenId, uint256 startingBid, uint256 duration)`
Creates a time-based auction for an NFT.

**Requirements:**
- Caller must own the NFT
- NFT must be approved for marketplace transfer
- Starting bid must be greater than 0
- Duration must be between 1 hour and 7 days
- NFT cannot already be listed or auctioned

**Example:**
```solidity
// Create 24-hour auction
marketplace.createAuction(
    nftTokenAddress,
    tokenId,
    ethers.parseEther("0.5"), // Starting bid
    86400 // 24 hours
);
```

#### `placeBid(bytes32 auctionId)`
Places a bid on an active auction.

**Requirements:**
- Auction must be active
- Auction must not have ended
- Bid must be higher than current highest bid
- Caller must have sufficient ETH

#### `endAuction(bytes32 auctionId)`
Finalizes an auction and transfers NFT to highest bidder.

**Requirements:**
- Auction must have ended
- Auction must not already be finalized
- Can be called by anyone after auction ends

### Utility Functions

#### `withdrawProceeds()`
Withdraws accumulated proceeds from sales.

**Requirements:**
- Caller must have proceeds available

#### `getActiveListings()`
Returns array of active listing IDs.

#### `getActiveAuctions()`
Returns array of active auction IDs.

#### `getListing(bytes32 listingId)`
Returns listing details.

#### `getAuction(bytes32 auctionId)`
Returns auction details.

## Events

### Listing Events
- `ItemListed`: Emitted when NFT is listed
- `ListingCancelled`: Emitted when listing is cancelled
- `ItemBought`: Emitted when NFT is purchased

### Auction Events
- `AuctionCreated`: Emitted when auction is created
- `BidPlaced`: Emitted when bid is placed
- `AuctionFinalized`: Emitted when auction ends

### Utility Events
- `ProceedsWithdrawn`: Emitted when proceeds are withdrawn
- `MarketplaceFeeUpdated`: Emitted when fee is updated

## Security Features

### ReentrancyGuard
All state-changing functions are protected against reentrancy attacks.

### Pull Payments
Sellers must explicitly withdraw proceeds, preventing push payment vulnerabilities.

### Access Control
- Only contract owner can update fees
- Only listing/auction owners can cancel
- Pausable functionality for emergencies

### Input Validation
- Price validation (must be > 0)
- Duration validation (1 hour to 7 days)
- Bid validation (must be higher than current)

## Usage Examples

### Complete Listing Flow
```solidity
// 1. Mint NFT
await nftToken.mint(seller.address, "https://example.com/metadata");

// 2. Approve marketplace
await nftToken.connect(seller).approve(marketplaceAddress, tokenId);

// 3. Create listing
const tx = await marketplace.connect(seller).listItem(
    nftTokenAddress,
    tokenId,
    ethers.parseEther("1.0")
);

// 4. Buy listing
await marketplace.connect(buyer).buyNow(listingId, { 
    value: ethers.parseEther("1.0") 
});

// 5. Withdraw proceeds
await marketplace.connect(seller).withdrawProceeds();
```

### Complete Auction Flow
```solidity
// 1. Mint NFT
await nftToken.mint(seller.address, "https://example.com/metadata");

// 2. Approve marketplace
await nftToken.connect(seller).approve(marketplaceAddress, tokenId);

// 3. Create auction
const tx = await marketplace.connect(seller).createAuction(
    nftTokenAddress,
    tokenId,
    ethers.parseEther("0.5"),
    3600 // 1 hour
);

// 4. Place bids
await marketplace.connect(bidder1).placeBid(auctionId, { 
    value: ethers.parseEther("1.0") 
});

await marketplace.connect(bidder2).placeBid(auctionId, { 
    value: ethers.parseEther("1.5") 
});

// 5. End auction (after time expires)
await ethers.provider.send("evm_increaseTime", [3601]);
await ethers.provider.send("evm_mine", []);
await marketplace.connect(bidder2).endAuction(auctionId);

// 6. Withdraw proceeds
await marketplace.connect(seller).withdrawProceeds();
```

## Testing

Run the comprehensive test suite:

```bash
# Run all tests
pnpm test:contracts

# Run only marketplace tests
pnpm test:marketplace

# Run with coverage
pnpm --filter contracts coverage
```

## Deployment

Deploy the complete marketplace:

```bash
# Deploy to local network
pnpm deploy:marketplace

# Deploy to Sepolia testnet
pnpm deploy:marketplace:sepolia
```

## Gas Optimization

The contract is optimized for gas efficiency:
- Uses `bytes32` for IDs instead of `uint256`
- Efficient array management
- Minimal storage operations
- Optimized event emissions

## Error Handling

All functions use custom errors for gas efficiency:
- `ListingNotFound`: Listing doesn't exist
- `AuctionNotFound`: Auction doesn't exist
- `InvalidPrice`: Price validation failed
- `BidTooLow`: Bid below current highest
- `NotListingOwner`: Unauthorized cancellation
- And many more...

## Integration

The marketplace integrates seamlessly with:
- Any ERC-721 NFT contract
- Frontend applications via ethers.js
- IPFS for metadata storage
- Wallet providers for user interaction
