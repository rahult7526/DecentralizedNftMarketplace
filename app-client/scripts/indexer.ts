#!/usr/bin/env node

/**
 * NFT Marketplace Event Indexer
 * 
 * This script listens to marketplace events and indexes them to Supabase
 * Events: ItemListed, ItemBought, AuctionCreated, BidPlaced, AuctionFinalized
 */

import { ethers } from 'ethers'
import { createClient } from '@supabase/supabase-js'
import { MARKETPLACE_CONTRACT_ABI, NFT_CONTRACT_ABI } from '../lib/contracts'

// Configuration
const config = {
  // Alchemy configuration
  alchemyApiKey: process.env.ALCHEMY_API_KEY || '',
  networkName: process.env.NETWORK_NAME || 'localhost',
  
  // Supabase configuration
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  
  // Contract addresses
  marketplaceAddress: process.env.MARKETPLACE_CONTRACT_ADDRESS || '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
  nftAddress: process.env.NFT_CONTRACT_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3',
  
  // Indexer settings
  startBlock: parseInt(process.env.INDEXER_START_BLOCK || '0'),
  pollInterval: parseInt(process.env.INDEXER_POLL_INTERVAL || '5000'),
  batchSize: parseInt(process.env.INDEXER_BATCH_SIZE || '1000'),
}

// Initialize providers and clients
const getProvider = () => {
  if (config.networkName === 'localhost') {
    return new ethers.JsonRpcProvider('http://localhost:8545')
  }
  return new ethers.AlchemyProvider(config.networkName, config.alchemyApiKey)
}

const provider = getProvider()
const supabase = createClient(config.supabaseUrl, config.supabaseServiceKey)

// Contract instances
const marketplaceContract = new ethers.Contract(
  config.marketplaceAddress,
  MARKETPLACE_CONTRACT_ABI,
  provider
)

const nftContract = new ethers.Contract(
  config.nftAddress,
  NFT_CONTRACT_ABI,
  provider
)

// Event handlers
class EventIndexer {
  
  async getLastProcessedBlock(contractAddress: string, eventName: string): Promise<number> {
    const { data, error } = await supabase
      .from('event_processing')
      .select('last_processed_block')
      .eq('contract_address', contractAddress)
      .eq('event_name', eventName)
      .single()
    
    if (error && error.code !== 'PGRST116') {
      console.error('Error getting last processed block:', error)
      return config.startBlock
    }
    
    return data?.last_processed_block || config.startBlock
  }
  
  async updateLastProcessedBlock(contractAddress: string, eventName: string, blockNumber: number) {
    const { error } = await supabase
      .from('event_processing')
      .upsert({
        contract_address: contractAddress,
        event_name: eventName,
        last_processed_block: blockNumber,
        last_processed_at: new Date().toISOString()
      })
    
    if (error) {
      console.error('Error updating last processed block:', error)
    }
  }
  
  // Get NFT metadata from contract or IPFS
  async getNFTMetadata(tokenId: string) {
    try {
      const tokenURI = await nftContract.tokenURI(tokenId)
      
      if (tokenURI.startsWith('ipfs://')) {
        const ipfsHash = tokenURI.replace('ipfs://', '')
        const response = await fetch(`https://ipfs.io/ipfs/${ipfsHash}`)
        if (response.ok) {
          return await response.json()
        }
      } else if (tokenURI.startsWith('http')) {
        const response = await fetch(tokenURI)
        if (response.ok) {
          return await response.json()
        }
      }
      
      return { name: `NFT #${tokenId}`, description: '', image: '' }
    } catch (error) {
      console.error('Error fetching NFT metadata:', error)
      return { name: `NFT #${tokenId}`, description: '', image: '' }
    }
  }
  
  // Handle ItemListed event
  async handleItemListed(event: ethers.EventLog) {
    try {
      const { listingId, nftContract, tokenId, seller, price } = event.args!
      const metadata = await this.getNFTMetadata(tokenId.toString())
      
      const { error } = await supabase
        .from('listings')
        .insert({
          listing_id: listingId.toString(),
          nft_contract_address: nftContract,
          token_id: tokenId.toString(),
          seller_address: seller,
          price: ethers.formatEther(price),
          currency: 'ETH',
          listing_type: 'FIXED_PRICE',
          status: 'ACTIVE',
          transaction_hash: event.transactionHash,
          block_number: event.blockNumber,
          metadata: metadata
        })
      
      if (error) {
        console.error('Error inserting listing:', error)
      } else {
        console.log(`📝 Listed: NFT #${tokenId} for ${ethers.formatEther(price)} ETH`)
      }
    } catch (error) {
      console.error('Error handling ItemListed event:', error)
    }
  }
  
  // Handle ItemBought event
  async handleItemBought(event: ethers.EventLog) {
    try {
      const { listingId, buyer, price } = event.args!
      
      const { error } = await supabase
        .from('listings')
        .update({
          status: 'SOLD',
          sold_at: new Date().toISOString(),
          sold_to: buyer,
          updated_at: new Date().toISOString()
        })
        .eq('listing_id', listingId.toString())
      
      if (error) {
        console.error('Error updating listing:', error)
      } else {
        console.log(`🛒 Sold: Listing #${listingId} to ${buyer}`)
      }
    } catch (error) {
      console.error('Error handling ItemBought event:', error)
    }
  }
  
  // Handle AuctionCreated event
  async handleAuctionCreated(event: ethers.EventLog) {
    try {
      const { auctionId, nftContract, tokenId, seller, startingBid, endTime } = event.args!
      const metadata = await this.getNFTMetadata(tokenId.toString())
      
      const { error } = await supabase
        .from('auctions')
        .insert({
          auction_id: auctionId,
          nft_contract_address: nftContract,
          token_id: tokenId.toString(),
          seller_address: seller,
          starting_bid: ethers.formatEther(startingBid),
          current_bid: '0',
          start_time: new Date().toISOString(),
          end_time: new Date(Number(endTime) * 1000).toISOString(),
          status: 'ACTIVE',
          transaction_hash: event.transactionHash,
          block_number: event.blockNumber,
          metadata: metadata
        })
      
      if (error) {
        console.error('Error inserting auction:', error)
      } else {
        console.log(`🔨 Auction Created: NFT #${tokenId} starting at ${ethers.formatEther(startingBid)} ETH`)
      }
    } catch (error) {
      console.error('Error handling AuctionCreated event:', error)
    }
  }
  
  // Handle BidPlaced event
  async handleBidPlaced(event: ethers.EventLog) {
    try {
      const { auctionId, bidder, amount } = event.args!
      const bidAmount = ethers.formatEther(amount)
      
      // Insert bid record
      const { error: bidError } = await supabase
        .from('bids')
        .insert({
          auction_id: auctionId,
          bidder_address: bidder,
          bid_amount: bidAmount,
          transaction_hash: event.transactionHash,
          block_number: event.blockNumber
        })
      
      if (bidError) {
        console.error('Error inserting bid:', bidError)
        return
      }
      
      // Update auction with current highest bid
      const { error: auctionError } = await supabase
        .from('auctions')
        .update({
          current_bid: bidAmount,
          current_bidder: bidder,
          updated_at: new Date().toISOString()
        })
        .eq('auction_id', auctionId)
      
      if (auctionError) {
        console.error('Error updating auction:', auctionError)
      } else {
        console.log(`📈 New Bid: ${bidAmount} ETH on auction ${auctionId}`)
      }
    } catch (error) {
      console.error('Error handling BidPlaced event:', error)
    }
  }
  
  // Handle AuctionFinalized event
  async handleAuctionFinalized(event: ethers.EventLog) {
    try {
      const { auctionId, winner, winningBid } = event.args!
      
      const { error } = await supabase
        .from('auctions')
        .update({
          status: winner === ethers.ZeroAddress ? 'CANCELLED' : 'ENDED',
          is_finalized: true,
          updated_at: new Date().toISOString()
        })
        .eq('auction_id', auctionId)
      
      if (error) {
        console.error('Error finalizing auction:', error)
      } else {
        if (winner === ethers.ZeroAddress) {
          console.log(`❌ Auction Cancelled: ${auctionId}`)
        } else {
          console.log(`🏆 Auction Won: ${auctionId} by ${winner} for ${ethers.formatEther(winningBid)} ETH`)
        }
      }
    } catch (error) {
      console.error('Error handling AuctionFinalized event:', error)
    }
  }
  
  // Process events for a specific event type
  async processEvents(contract: ethers.Contract, eventName: string, handler: (event: ethers.EventLog) => Promise<void>) {
    const lastBlock = await this.getLastProcessedBlock(contract.target as string, eventName)
    const currentBlock = await provider.getBlockNumber()
    
    if (lastBlock >= currentBlock) {
      return // No new blocks to process
    }
    
    console.log(`Processing ${eventName} events from block ${lastBlock + 1} to ${currentBlock}`)
    
    // Process in batches to avoid rate limits
    for (let fromBlock = lastBlock + 1; fromBlock <= currentBlock; fromBlock += config.batchSize) {
      const toBlock = Math.min(fromBlock + config.batchSize - 1, currentBlock)
      
      try {
        const filter = contract.filters[eventName]()
        const events = await contract.queryFilter(filter, fromBlock, toBlock)
        
        for (const event of events) {
          if (event instanceof ethers.EventLog) {
            await handler(event)
          }
        }
        
        await this.updateLastProcessedBlock(contract.target as string, eventName, toBlock)
        
        if (events.length > 0) {
          console.log(`✅ Processed ${events.length} ${eventName} events (blocks ${fromBlock}-${toBlock})`)
        }
      } catch (error) {
        console.error(`Error processing ${eventName} events (blocks ${fromBlock}-${toBlock}):`, error)
        break // Stop processing this event type if there's an error
      }
    }
  }
  
  // Main indexing loop
  async start() {
    console.log('🚀 Starting NFT Marketplace Event Indexer...')
    console.log(`📍 Marketplace: ${config.marketplaceAddress}`)
    console.log(`🎨 NFT Contract: ${config.nftAddress}`)
    console.log(`🌐 Network: ${config.networkName}`)
    console.log(`⏱️  Poll Interval: ${config.pollInterval}ms`)
    
    const runIndexer = async () => {
      try {
        // Process marketplace events
        await this.processEvents(marketplaceContract, 'ItemListed', this.handleItemListed.bind(this))
        await this.processEvents(marketplaceContract, 'ItemBought', this.handleItemBought.bind(this))
        await this.processEvents(marketplaceContract, 'AuctionCreated', this.handleAuctionCreated.bind(this))
        await this.processEvents(marketplaceContract, 'BidPlaced', this.handleBidPlaced.bind(this))
        await this.processEvents(marketplaceContract, 'AuctionFinalized', this.handleAuctionFinalized.bind(this))
        
      } catch (error) {
        console.error('❌ Indexer error:', error)
      }
    }
    
    // Run immediately
    await runIndexer()
    
    // Set up polling
    setInterval(runIndexer, config.pollInterval)
    
    console.log('✅ Event indexer started successfully!')
  }
}

// Handle shutdown gracefully
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down event indexer...')
  process.exit(0)
})

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down event indexer...')
  process.exit(0)
})

// Start the indexer
if (require.main === module) {
  const indexer = new EventIndexer()
  indexer.start().catch(console.error)
}

export { EventIndexer }