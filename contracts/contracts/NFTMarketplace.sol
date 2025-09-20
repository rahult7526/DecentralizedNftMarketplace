// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title NFTMarketplace
 * @dev Decentralized marketplace for NFT trading with fixed price listings and auctions
 * @notice This contract handles listing, buying, and auctioning of NFTs with secure payment handling
 */
contract NFTMarketplace is ReentrancyGuard, Pausable, Ownable, IERC721Receiver {
    using Counters for Counters.Counter;

    // Listing ID counter
    Counters.Counter private _listingIdCounter;
    Counters.Counter private _auctionIdCounter;

    // Marketplace fee percentage (basis points)
    uint256 public marketplaceFeePercentage = 250; // 2.5%
    uint256 public constant MAX_MARKETPLACE_FEE = 1000; // 10%

    // Auction constants
    uint256 public constant MIN_AUCTION_DURATION = 3600; // 1 hour
    uint256 public constant MAX_AUCTION_DURATION = 604800; // 7 days
    uint256 public constant AUCTION_EXTENSION_TIME = 300; // 5 minutes

    // Listing struct
    struct Listing {
        bytes32 id;
        address nftContract;
        uint256 tokenId;
        address seller;
        uint256 price;
        bool isActive;
        uint256 createdAt;
    }

    // Auction struct
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

    // Mapping from listing ID to listing
    mapping(bytes32 => Listing) public listings;
    
    // Mapping from auction ID to auction
    mapping(bytes32 => Auction) public auctions;
    
    // Mapping from NFT contract + token ID to listing ID
    mapping(address => mapping(uint256 => bytes32)) public nftToListing;
    
    // Mapping from NFT contract + token ID to auction ID
    mapping(address => mapping(uint256 => bytes32)) public nftToAuction;
    
    // Mapping from user to their proceeds
    mapping(address => uint256) public proceeds;
    
    // Array of active listing IDs
    bytes32[] public activeListings;
    
    // Array of active auction IDs
    bytes32[] public activeAuctions;

    // Events
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

    // Errors
    error ListingNotFound();
    error AuctionNotFound();
    error ListingNotActive();
    error AuctionNotActive();
    error AuctionEnded();
    error AuctionNotEnded();
    error NotListingOwner();
    error NotAuctionOwner();
    error InvalidPrice();
    error InvalidDuration();
    error BidTooLow();
    error NoBids();
    error TransferFailed();
    error InvalidMarketplaceFee();
    error NFTAlreadyListed();
    error NFTAlreadyAuctioned();
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
     * @dev List an NFT for sale
     * @param nftContract Address of the NFT contract
     * @param tokenId Token ID to list
     * @param price Fixed price in wei
     */
    function listItem(
        address nftContract,
        uint256 tokenId,
        uint256 price
    ) external whenNotPaused nonReentrant {
        if (price == 0) {
            revert InvalidPrice();
        }

        // Check if NFT is already listed or auctioned
        if (nftToListing[nftContract][tokenId] != bytes32(0)) {
            revert NFTAlreadyListed();
        }
        if (nftToAuction[nftContract][tokenId] != bytes32(0)) {
            revert NFTAlreadyAuctioned();
        }

        // Transfer NFT to marketplace (requires approval)
        IERC721(nftContract).safeTransferFrom(msg.sender, address(this), tokenId);

        // Create listing
        bytes32 listingId = keccak256(abi.encodePacked(
            nftContract,
            tokenId,
            msg.sender,
            block.timestamp
        ));

        listings[listingId] = Listing({
            id: listingId,
            nftContract: nftContract,
            tokenId: tokenId,
            seller: msg.sender,
            price: price,
            isActive: true,
            createdAt: block.timestamp
        });

        nftToListing[nftContract][tokenId] = listingId;
        activeListings.push(listingId);

        emit ItemListed(listingId, nftContract, tokenId, msg.sender, price);
    }

    /**
     * @dev Cancel a listing
     * @param listingId Listing ID to cancel
     */
    function cancelListing(bytes32 listingId) external whenNotPaused nonReentrant {
        Listing storage listing = listings[listingId];
        
        if (listing.id == bytes32(0)) {
            revert ListingNotFound();
        }

        if (listing.seller != msg.sender && owner() != msg.sender) {
            revert NotListingOwner();
        }

        if (!listing.isActive) {
            revert ListingNotActive();
        }

        // Return NFT to seller
        IERC721(listing.nftContract).safeTransferFrom(
            address(this),
            listing.seller,
            listing.tokenId
        );

        // Update listing status
        listing.isActive = false;
        
        // Remove from active listings
        _removeFromActiveListings(listingId);
        
        // Clear mapping
        delete nftToListing[listing.nftContract][listing.tokenId];

        emit ListingCancelled(listingId);
    }

    /**
     * @dev Buy a listed item
     * @param listingId Listing ID to buy
     */
    function buyNow(bytes32 listingId) external payable whenNotPaused nonReentrant {
        Listing storage listing = listings[listingId];
        
        if (listing.id == bytes32(0)) {
            revert ListingNotFound();
        }

        if (!listing.isActive) {
            revert ListingNotActive();
        }

        if (msg.value != listing.price) {
            revert InvalidPrice();
        }

        // Calculate fees
        uint256 marketplaceFee = (listing.price * marketplaceFeePercentage) / 10000;
        uint256 sellerProceeds = listing.price - marketplaceFee;

        // Transfer NFT to buyer
        IERC721(listing.nftContract).safeTransferFrom(
            address(this),
            msg.sender,
            listing.tokenId
        );

        // Update listing status
        listing.isActive = false;
        
        // Remove from active listings
        _removeFromActiveListings(listingId);
        
        // Clear mapping
        delete nftToListing[listing.nftContract][listing.tokenId];

        // Add proceeds to seller's balance
        proceeds[listing.seller] += sellerProceeds;

        emit ItemBought(listingId, msg.sender, listing.price, marketplaceFee);
    }

    /**
     * @dev Create an auction
     * @param nftContract Address of the NFT contract
     * @param tokenId Token ID to auction
     * @param startingBid Starting bid in wei
     * @param duration Auction duration in seconds
     */
    function createAuction(
        address nftContract,
        uint256 tokenId,
        uint256 startingBid,
        uint256 duration
    ) external whenNotPaused nonReentrant {
        if (startingBid == 0) {
            revert InvalidPrice();
        }

        if (duration < MIN_AUCTION_DURATION || duration > MAX_AUCTION_DURATION) {
            revert InvalidDuration();
        }

        // Check if NFT is already listed or auctioned
        if (nftToListing[nftContract][tokenId] != bytes32(0)) {
            revert NFTAlreadyListed();
        }
        if (nftToAuction[nftContract][tokenId] != bytes32(0)) {
            revert NFTAlreadyAuctioned();
        }

        // Transfer NFT to marketplace
        IERC721(nftContract).safeTransferFrom(msg.sender, address(this), tokenId);

        // Create auction
        bytes32 auctionId = keccak256(abi.encodePacked(
            nftContract,
            tokenId,
            msg.sender,
            block.timestamp
        ));

        uint256 endTime = block.timestamp + duration;

        auctions[auctionId] = Auction({
            id: auctionId,
            nftContract: nftContract,
            tokenId: tokenId,
            seller: msg.sender,
            startingBid: startingBid,
            highestBid: 0,
            highestBidder: address(0),
            endTime: endTime,
            isActive: true,
            isFinalized: false,
            createdAt: block.timestamp
        });

        nftToAuction[nftContract][tokenId] = auctionId;
        activeAuctions.push(auctionId);

        emit AuctionCreated(auctionId, nftContract, tokenId, msg.sender, startingBid, endTime);
    }

    /**
     * @dev Place a bid on an auction
     * @param auctionId Auction ID to bid on
     */
    function placeBid(bytes32 auctionId) external payable whenNotPaused nonReentrant {
        Auction storage auction = auctions[auctionId];
        
        if (auction.id == bytes32(0)) {
            revert AuctionNotFound();
        }

        if (!auction.isActive) {
            revert AuctionNotActive();
        }

        if (block.timestamp >= auction.endTime) {
            revert AuctionEnded();
        }

        if (msg.value <= auction.highestBid) {
            revert BidTooLow();
        }

        // Refund previous highest bidder
        if (auction.highestBidder != address(0)) {
            proceeds[auction.highestBidder] += auction.highestBid;
        }

        // Update auction with new bid
        auction.highestBid = msg.value;
        auction.highestBidder = msg.sender;

        // Extend auction if bid is placed in last 5 minutes
        if (auction.endTime - block.timestamp < AUCTION_EXTENSION_TIME) {
            auction.endTime = block.timestamp + AUCTION_EXTENSION_TIME;
        }

        emit BidPlaced(auctionId, msg.sender, msg.value);
    }

    /**
     * @dev End an auction and finalize the sale
     * @param auctionId Auction ID to end
     */
    function endAuction(bytes32 auctionId) external whenNotPaused nonReentrant {
        Auction storage auction = auctions[auctionId];
        
        if (auction.id == bytes32(0)) {
            revert AuctionNotFound();
        }

        if (!auction.isActive) {
            revert AuctionNotActive();
        }

        if (block.timestamp < auction.endTime) {
            revert AuctionNotEnded();
        }

        if (auction.isFinalized) {
            revert AuctionNotActive();
        }

        // Mark auction as finalized
        auction.isFinalized = true;
        auction.isActive = false;
        
        // Remove from active auctions
        _removeFromActiveAuctions(auctionId);
        
        // Clear mapping
        delete nftToAuction[auction.nftContract][auction.tokenId];

        if (auction.highestBidder != address(0)) {
            // Calculate fees
            uint256 marketplaceFee = (auction.highestBid * marketplaceFeePercentage) / 10000;
            uint256 sellerProceeds = auction.highestBid - marketplaceFee;

            // Transfer NFT to winner
            IERC721(auction.nftContract).safeTransferFrom(
                address(this),
                auction.highestBidder,
                auction.tokenId
            );

            // Add proceeds to seller's balance
            proceeds[auction.seller] += sellerProceeds;

            emit AuctionFinalized(auctionId, auction.highestBidder, auction.highestBid, marketplaceFee);
        } else {
            // No bids, return NFT to seller
            IERC721(auction.nftContract).safeTransferFrom(
                address(this),
                auction.seller,
                auction.tokenId
            );

            emit AuctionFinalized(auctionId, address(0), 0, 0);
        }
    }

    /**
     * @dev Withdraw proceeds
     */
    function withdrawProceeds() external nonReentrant {
        uint256 amount = proceeds[msg.sender];
        if (amount == 0) {
            revert NoBids();
        }

        proceeds[msg.sender] = 0;

        (bool success, ) = msg.sender.call{value: amount}("");
        if (!success) {
            revert TransferFailed();
        }

        emit ProceedsWithdrawn(msg.sender, amount);
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
     * @dev Get active listings
     * @return Array of active listing IDs
     */
    function getActiveListings() external view returns (bytes32[] memory) {
        return activeListings;
    }

    /**
     * @dev Get active auctions
     * @return Array of active auction IDs
     */
    function getActiveAuctions() external view returns (bytes32[] memory) {
        return activeAuctions;
    }

    /**
     * @dev Get listing details
     * @param listingId Listing ID
     * @return listing Listing details
     */
    function getListing(bytes32 listingId) external view returns (Listing memory) {
        return listings[listingId];
    }

    /**
     * @dev Get auction details
     * @param auctionId Auction ID
     * @return auction Auction details
     */
    function getAuction(bytes32 auctionId) external view returns (Auction memory) {
        return auctions[auctionId];
    }

    /**
     * @dev Get user's proceeds
     * @param user User address
     * @return amount Amount of proceeds available
     */
    function getProceeds(address user) external view returns (uint256) {
        return proceeds[user];
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

    /**
     * @dev Remove listing from active listings array
     * @param listingId Listing ID to remove
     */
    function _removeFromActiveListings(bytes32 listingId) private {
        for (uint256 i = 0; i < activeListings.length; i++) {
            if (activeListings[i] == listingId) {
                activeListings[i] = activeListings[activeListings.length - 1];
                activeListings.pop();
                break;
            }
        }
    }

    /**
     * @dev Remove auction from active auctions array
     * @param auctionId Auction ID to remove
     */
    function _removeFromActiveAuctions(bytes32 auctionId) private {
        for (uint256 i = 0; i < activeAuctions.length; i++) {
            if (activeAuctions[i] == auctionId) {
                activeAuctions[i] = activeAuctions[activeAuctions.length - 1];
                activeAuctions.pop();
                break;
            }
        }
    }
}
