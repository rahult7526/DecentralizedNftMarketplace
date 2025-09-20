import { ethers } from 'ethers'

// Contract ABIs (simplified for example)
export const NFT_CONTRACT_ABI = [
  'function mint(address to, string memory tokenURI, address royaltyRecipient, uint256 royaltyPercentage) external returns (uint256)',
  'function tokenURI(uint256 tokenId) external view returns (string memory)',
  'function ownerOf(uint256 tokenId) external view returns (address)',
  'function balanceOf(address owner) external view returns (uint256)',
  'function totalSupply() external view returns (uint256)',
  'function exists(uint256 tokenId) external view returns (bool)',
  'function getRoyaltyInfo(uint256 tokenId) external view returns (address recipient, uint256 percentage)',
  'event TokenMinted(uint256 indexed tokenId, address indexed to, string tokenURI, address indexed creator)',
]

export const MARKETPLACE_CONTRACT_ABI = [
  'function createFixedPriceListing(address nftContract, uint256 tokenId, uint256 price) external',
  'function createAuctionListing(address nftContract, uint256 tokenId, uint256 startingPrice, uint256 duration) external',
  'function buyFixedPrice(uint256 listingId) external payable',
  'function placeBid(uint256 listingId) external payable',
  'function endAuction(uint256 listingId) external',
  'function cancelListing(uint256 listingId) external',
  'function getListing(uint256 listingId) external view returns (tuple(uint256 id, address nftContract, uint256 tokenId, address seller, uint256 price, uint256 currentBid, address currentBidder, uint8 listingType, uint8 status, uint256 endTime, uint256 createdAt))',
  'function getUserListings(address user) external view returns (uint256[] memory)',
  'function getActiveListingsCount() external view returns (uint256)',
  'event ListingCreated(uint256 indexed listingId, address indexed nftContract, uint256 indexed tokenId, address seller, uint256 price, uint8 listingType, uint256 endTime)',
  'event ItemSold(uint256 indexed listingId, address indexed buyer, uint256 price, uint256 marketplaceFee, uint256 royaltyFee)',
  'event BidPlaced(uint256 indexed listingId, address indexed bidder, uint256 amount)',
]

// Contract addresses (will be set after deployment)
export const CONTRACT_ADDRESSES = {
  NFT_CONTRACT: process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS || '',
  MARKETPLACE_CONTRACT: process.env.NEXT_PUBLIC_MARKETPLACE_CONTRACT_ADDRESS || '',
}

// Contract instances
export function getNFTContract(provider: ethers.Provider) {
  if (!CONTRACT_ADDRESSES.NFT_CONTRACT) {
    throw new Error('NFT contract address not set')
  }
  return new ethers.Contract(CONTRACT_ADDRESSES.NFT_CONTRACT, NFT_CONTRACT_ABI, provider)
}

export function getMarketplaceContract(provider: ethers.Provider) {
  if (!CONTRACT_ADDRESSES.MARKETPLACE_CONTRACT) {
    throw new Error('Marketplace contract address not set')
  }
  return new ethers.Contract(CONTRACT_ADDRESSES.MARKETPLACE_CONTRACT, MARKETPLACE_CONTRACT_ABI, provider)
}

// Contract interaction helpers
export async function mintNFT(
  contract: ethers.Contract,
  to: string,
  tokenURI: string,
  royaltyRecipient: string,
  royaltyPercentage: number
) {
  const tx = await contract.mint(to, tokenURI, royaltyRecipient, royaltyPercentage)
  const receipt = await tx.wait()
  return receipt
}

export async function createFixedPriceListing(
  contract: ethers.Contract,
  nftContract: string,
  tokenId: number,
  price: string
) {
  const tx = await contract.createFixedPriceListing(nftContract, tokenId, price)
  const receipt = await tx.wait()
  return receipt
}

export async function createAuctionListing(
  contract: ethers.Contract,
  nftContract: string,
  tokenId: number,
  startingPrice: string,
  duration: number
) {
  const tx = await contract.createAuctionListing(nftContract, tokenId, startingPrice, duration)
  const receipt = await tx.wait()
  return receipt
}

export async function buyFixedPrice(
  contract: ethers.Contract,
  listingId: number,
  value: string
) {
  const tx = await contract.buyFixedPrice(listingId, { value })
  const receipt = await tx.wait()
  return receipt
}

export async function placeBid(
  contract: ethers.Contract,
  listingId: number,
  value: string
) {
  const tx = await contract.placeBid(listingId, { value })
  const receipt = await tx.wait()
  return receipt
}

