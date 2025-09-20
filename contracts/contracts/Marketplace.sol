// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./interfaces/IMarketplace.sol";

/**
 * @title Marketplace
 * @dev Decentralized marketplace for NFT trading with support for fixed price and auction sales
 * @notice This contract handles listing, buying, and auctioning of NFTs with royalty support
 */
contract Marketplace is IMarketplace, ReentrancyGuard, Pausable, Ownable, IERC721Receiver {
    using Counters for Counters.Counter;

    // Listing ID counter
    Counters.Counter private _listingIdCounter;

    // Marketplace fee percentage (basis points)
    uint256 public marketplaceFeePercentage = 250; // 2.5%

    // Maximum marketplace fee (basis points)
    uint256 public constant MAX_MARKETPLACE_FEE = 1000; // 10%

    // Minimum auction duration (seconds)
    uint256 public constant MIN_AUCTION_DURATION = 3600; // 1 hour

    // Maximum auction duration (seconds)
    uint256 public constant MAX_AUCTION_DURATION = 604800; // 7 days

    // Auction extension time (seconds)
    uint256 public constant AUCTION_EXTENSION_TIME = 300; // 5 minutes

    // Mapping from listing ID to listing
    mapping(uint256 => Listing) public listings;

    // Mapping from token address => token ID => listing ID
    mapping(address => mapping(uint256 => uint256)) public tokenToListing;

    // Mapping from user address => listing IDs
    mapping(address => uint256[]) public userListings;

    // Events
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

    // Errors
    error ListingNotFound();
    error ListingNotActive();
    error NotListingOwner();
    error InvalidPrice();
    error InvalidDuration();
    error AuctionNotEnded();
    error AuctionEnded();
    error BidTooLow();
    error NoBids();
    error TransferFailed();
    error InvalidMarketplaceFee();
    error NotAuthorized();

    /**
     * @dev Constructor
     * @param _marketplaceFeePercentage Initial marketplace fee percentage
     */
    constructor(uint256 _marketplaceFeePercentage) {
        if (_marketplaceFeePercentage > MAX_MARKETPLACE_FEE) {
            revert InvalidMarketplaceFee();
        }
        marketplaceFeePercentage = _marketplaceFeePercentage;
    }

    /**
     * @dev Create a fixed price listing
     * @param nftContract Address of the NFT contract
     * @param tokenId Token ID to list
     * @param price Fixed price in wei
     */
    function createFixedPriceListing(
        address nftContract,
        uint256 tokenId,
        uint256 price
    ) external whenNotPaused nonReentrant {
        if (price == 0) {
            revert InvalidPrice();
        }

        _createListing(nftContract, tokenId, price, ListingType.FixedPrice, 0);
    }

    /**
     * @dev Create an auction listing
     * @param nftContract Address of the NFT contract
     * @param tokenId Token ID to list
     * @param startingPrice Starting price in wei
     * @param duration Auction duration in seconds
     */
    function createAuctionListing(
        address nftContract,
        uint256 tokenId,
        uint256 startingPrice,
        uint256 duration
    ) external whenNotPaused nonReentrant {
        if (startingPrice == 0) {
            revert InvalidPrice();
        }

        if (duration < MIN_AUCTION_DURATION || duration > MAX_AUCTION_DURATION) {
            revert InvalidDuration();
        }

        uint256 endTime = block.timestamp + duration;
        _createListing(nftContract, tokenId, startingPrice, ListingType.Auction, endTime);
    }

    /**
     * @dev Buy a fixed price listing
     * @param listingId Listing ID to buy
     */
    function buyFixedPrice(uint256 listingId) external payable whenNotPaused nonReentrant {
        Listing storage listing = listings[listingId];
        
        if (listing.id == 0) {
            revert ListingNotFound();
        }

        if (listing.listingType != ListingType.FixedPrice) {
            revert NotAuthorized();
        }

        if (listing.status != ListingStatus.Active) {
            revert ListingNotActive();
        }

        if (msg.value != listing.price) {
            revert InvalidPrice();
        }

        _executeSale(listingId, msg.sender, listing.price);
    }

    /**
     * @dev Place a bid on an auction
     * @param listingId Listing ID to bid on
     */
    function placeBid(uint256 listingId) external payable whenNotPaused nonReentrant {
        Listing storage listing = listings[listingId];
        
        if (listing.id == 0) {
            revert ListingNotFound();
        }

        if (listing.listingType != ListingType.Auction) {
            revert NotAuthorized();
        }

        if (listing.status != ListingStatus.Active) {
            revert ListingNotActive();
        }

        if (block.timestamp >= listing.endTime) {
            revert AuctionEnded();
        }

        if (msg.value <= listing.currentBid) {
            revert BidTooLow();
        }

        // Refund previous highest bidder
        if (listing.currentBidder != address(0)) {
            (bool success, ) = listing.currentBidder.call{value: listing.currentBid}("");
            if (!success) {
                revert TransferFailed();
            }
        }

        // Update bid information
        listing.currentBid = msg.value;
        listing.currentBidder = msg.sender;

        // Extend auction if bid is placed in last 5 minutes
        if (listing.endTime - block.timestamp < AUCTION_EXTENSION_TIME) {
            listing.endTime = block.timestamp + AUCTION_EXTENSION_TIME;
        }

        emit BidPlaced(listingId, msg.sender, msg.value);
    }

    /**
     * @dev End an auction and transfer NFT to highest bidder
     * @param listingId Listing ID to end
     */
    function endAuction(uint256 listingId) external whenNotPaused nonReentrant {
        Listing storage listing = listings[listingId];
        
        if (listing.id == 0) {
            revert ListingNotFound();
        }

        if (listing.listingType != ListingType.Auction) {
            revert NotAuthorized();
        }

        if (block.timestamp < listing.endTime) {
            revert AuctionNotEnded();
        }

        if (listing.currentBidder == address(0)) {
            revert NoBids();
        }

        _executeSale(listingId, listing.currentBidder, listing.currentBid);
    }

    /**
     * @dev Cancel a listing
     * @param listingId Listing ID to cancel
     */
    function cancelListing(uint256 listingId) external whenNotPaused nonReentrant {
        Listing storage listing = listings[listingId];
        
        if (listing.id == 0) {
            revert ListingNotFound();
        }

        if (listing.seller != msg.sender && owner() != msg.sender) {
            revert NotListingOwner();
        }

        if (listing.status != ListingStatus.Active) {
            revert ListingNotActive();
        }

        // Refund bid if it's an auction with bids
        if (listing.listingType == ListingType.Auction && listing.currentBidder != address(0)) {
            (bool success, ) = listing.currentBidder.call{value: listing.currentBid}("");
            if (!success) {
                revert TransferFailed();
            }
        }

        // Return NFT to seller
        IERC721(listing.nftContract).safeTransferFrom(
            address(this),
            listing.seller,
            listing.tokenId
        );

        listing.status = ListingStatus.Cancelled;

        emit ListingCancelled(listingId);
    }

    /**
     * @dev Update marketplace fee (only owner)
     * @param newFeePercentage New fee percentage in basis points
     */
    function setMarketplaceFee(uint256 newFeePercentage) external onlyOwner {
        if (newFeePercentage > MAX_MARKETPLACE_FEE) {
            revert InvalidMarketplaceFee();
        }

        marketplaceFeePercentage = newFeePercentage;
        emit MarketplaceFeeUpdated(newFeePercentage);
    }

    /**
     * @dev Pause marketplace
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause marketplace
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Withdraw marketplace fees (only owner)
     */
    function withdrawFees() external onlyOwner {
        uint256 balance = address(this).balance;
        (bool success, ) = owner().call{value: balance}("");
        if (!success) {
            revert TransferFailed();
        }
    }

    /**
     * @dev Get listing details
     * @param listingId Listing ID
     * @return listing Listing details
     */
    function getListing(uint256 listingId) external view returns (Listing memory) {
        return listings[listingId];
    }

    /**
     * @dev Get user's listings
     * @param user User address
     * @return listingIds Array of listing IDs
     */
    function getUserListings(address user) external view returns (uint256[] memory) {
        return userListings[user];
    }

    /**
     * @dev Get active listings count
     * @return count Number of active listings
     */
    function getActiveListingsCount() external view returns (uint256) {
        return _listingIdCounter.current();
    }

    /**
     * @dev Internal function to create a listing
     */
    function _createListing(
        address nftContract,
        uint256 tokenId,
        uint256 price,
        ListingType listingType,
        uint256 endTime
    ) internal {
        // Check if token is already listed
        if (tokenToListing[nftContract][tokenId] != 0) {
            revert NotAuthorized();
        }

        // Transfer NFT to marketplace
        IERC721(nftContract).safeTransferFrom(msg.sender, address(this), tokenId);

        // Create listing
        uint256 listingId = _listingIdCounter.current();
        _listingIdCounter.increment();

        listings[listingId] = Listing({
            id: listingId,
            nftContract: nftContract,
            tokenId: tokenId,
            seller: msg.sender,
            price: price,
            currentBid: 0,
            currentBidder: address(0),
            listingType: listingType,
            status: ListingStatus.Active,
            endTime: endTime,
            createdAt: block.timestamp
        });

        tokenToListing[nftContract][tokenId] = listingId;
        userListings[msg.sender].push(listingId);

        emit ListingCreated(listingId, nftContract, tokenId, msg.sender, price, listingType, endTime);
    }

    /**
     * @dev Internal function to execute a sale
     */
    function _executeSale(
        uint256 listingId,
        address buyer,
        uint256 price
    ) internal {
        Listing storage listing = listings[listingId];

        // Calculate fees
        uint256 marketplaceFee = (price * marketplaceFeePercentage) / 10000;
        uint256 royaltyFee = 0;

        // Try to get royalty information from NFT contract
        try IERC721(listing.nftContract).supportsInterface(0x2a55205a) returns (bool supported) {
            if (supported) {
                // This would require implementing ERC-2981 royalty standard
                // For now, we'll skip royalty calculation
            }
        } catch {}

        // Calculate seller proceeds
        uint256 sellerProceeds = price - marketplaceFee - royaltyFee;

        // Transfer NFT to buyer
        IERC721(listing.nftContract).safeTransferFrom(
            address(this),
            buyer,
            listing.tokenId
        );

        // Transfer payment to seller
        (bool success, ) = listing.seller.call{value: sellerProceeds}("");
        if (!success) {
            revert TransferFailed();
        }

        // Update listing status
        listing.status = ListingStatus.Sold;

        // Remove from token to listing mapping
        delete tokenToListing[listing.nftContract][listing.tokenId];

        emit ItemSold(listingId, buyer, price, marketplaceFee, royaltyFee);
    }

    /**
     * @dev Required for receiving NFTs
     */
    function onERC721Received(
        address,
        address,
        uint256,
        bytes memory
    ) public pure override returns (bytes4) {
        return this.onERC721Received.selector;
    }
}

