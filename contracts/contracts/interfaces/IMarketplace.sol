// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title IMarketplace
 * @dev Interface for the DeNft Marketplace contract
 */
interface IMarketplace {
    enum ListingType {
        FixedPrice,
        Auction
    }

    enum ListingStatus {
        Active,
        Sold,
        Cancelled
    }

    struct Listing {
        uint256 id;
        address nftContract;
        uint256 tokenId;
        address seller;
        uint256 price;
        uint256 currentBid;
        address currentBidder;
        ListingType listingType;
        ListingStatus status;
        uint256 endTime;
        uint256 createdAt;
    }

    event ListingCreated(
        uint256 indexed listingId,
        address indexed nftContract,
        uint256 indexed tokenId,
        address seller,
        uint256 price,
        ListingType listingType,
        uint256 endTime
    );

    event ListingUpdated(
        uint256 indexed listingId,
        uint256 newPrice,
        uint256 newEndTime
    );

    event ListingCancelled(uint256 indexed listingId);

    event ItemSold(
        uint256 indexed listingId,
        address indexed buyer,
        uint256 price,
        uint256 marketplaceFee,
        uint256 royaltyFee
    );

    event BidPlaced(
        uint256 indexed listingId,
        address indexed bidder,
        uint256 amount
    );

    event BidWithdrawn(
        uint256 indexed listingId,
        address indexed bidder,
        uint256 amount
    );

    event MarketplaceFeeUpdated(uint256 newFeePercentage);

    function createFixedPriceListing(
        address nftContract,
        uint256 tokenId,
        uint256 price
    ) external;

    function createAuctionListing(
        address nftContract,
        uint256 tokenId,
        uint256 startingPrice,
        uint256 duration
    ) external;

    function buyFixedPrice(uint256 listingId) external payable;

    function placeBid(uint256 listingId) external payable;

    function endAuction(uint256 listingId) external;

    function cancelListing(uint256 listingId) external;

    function getListing(uint256 listingId) external view returns (Listing memory);

    function getUserListings(address user) external view returns (uint256[] memory);

    function getActiveListingsCount() external view returns (uint256);
}

