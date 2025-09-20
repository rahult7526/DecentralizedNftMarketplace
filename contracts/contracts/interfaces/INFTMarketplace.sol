// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title INFTMarketplace
 * @dev Interface for the NFT Marketplace contract
 */
interface INFTMarketplace {
    struct Listing {
        bytes32 id;
        address nftContract;
        uint256 tokenId;
        address seller;
        uint256 price;
        bool isActive;
        uint256 createdAt;
    }

    struct Auction {
        bytes32 id;
        address nftContract;
        uint256 tokenId;
        address seller;
        uint256 startingBid;
        uint256 highestBid;
        address highestBidder;
        uint256 endTime;
        bool isActive;
        bool isFinalized;
        uint256 createdAt;
    }

    event ItemListed(
        bytes32 indexed listingId,
        address indexed nftContract,
        uint256 indexed tokenId,
        address seller,
        uint256 price
    );
    
    event ListingCancelled(bytes32 indexed listingId);
    
    event ItemBought(
        bytes32 indexed listingId,
        address indexed buyer,
        uint256 price,
        uint256 marketplaceFee
    );
    
    event AuctionCreated(
        bytes32 indexed auctionId,
        address indexed nftContract,
        uint256 indexed tokenId,
        address seller,
        uint256 startingBid,
        uint256 endTime
    );
    
    event BidPlaced(
        bytes32 indexed auctionId,
        address indexed bidder,
        uint256 amount
    );
    
    event AuctionFinalized(
        bytes32 indexed auctionId,
        address indexed winner,
        uint256 winningBid,
        uint256 marketplaceFee
    );
    
    event ProceedsWithdrawn(address indexed seller, uint256 amount);
    
    event MarketplaceFeeUpdated(uint256 newFeePercentage);

    function listItem(
        address nftContract,
        uint256 tokenId,
        uint256 price
    ) external;

    function cancelListing(bytes32 listingId) external;

    function buyNow(bytes32 listingId) external payable;

    function createAuction(
        address nftContract,
        uint256 tokenId,
        uint256 startingBid,
        uint256 duration
    ) external;

    function placeBid(bytes32 auctionId) external payable;

    function endAuction(bytes32 auctionId) external;

    function withdrawProceeds() external;

    function getActiveListings() external view returns (bytes32[] memory);

    function getActiveAuctions() external view returns (bytes32[] memory);

    function getListing(bytes32 listingId) external view returns (Listing memory);

    function getAuction(bytes32 auctionId) external view returns (Auction memory);

    function getProceeds(address user) external view returns (uint256);
}
