import { NextRequest, NextResponse } from 'next/server'
import { DatabaseService } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { auctionId: string } }
) {
  try {
    const auctionId = params.auctionId
    
    if (!auctionId) {
      return NextResponse.json(
        { success: false, error: 'Auction ID is required' },
        { status: 400 }
      )
    }
    
    // Get auction details
    const auction = await DatabaseService.getAuctionById(auctionId)
    
    if (!auction) {
      return NextResponse.json(
        { success: false, error: 'Auction not found' },
        { status: 404 }
      )
    }
    
    // Get auction bids
    const bids = await DatabaseService.getAuctionBids(auctionId)
    
    // Transform auction data
    const transformedAuction = {
      auctionId: auction.auction_id,
      nftContract: auction.nft_contract_address,
      tokenId: auction.token_id,
      seller: auction.seller_address,
      startingBid: auction.starting_bid,
      currentBid: auction.current_bid,
      currentBidder: auction.current_bidder,
      reservePrice: auction.reserve_price,
      startTime: auction.start_time,
      endTime: auction.end_time,
      status: auction.status,
      isFinalized: auction.is_finalized,
      createdAt: auction.created_at,
      metadata: auction.metadata,
      transactionHash: auction.transaction_hash,
      blockNumber: auction.block_number
    }
    
    // Transform bids data
    const transformedBids = bids.map(bid => ({
      id: bid.id,
      auctionId: bid.auction_id,
      bidder: bid.bidder_address,
      amount: bid.bid_amount,
      createdAt: bid.created_at,
      transactionHash: bid.transaction_hash,
      blockNumber: bid.block_number
    }))
    
    return NextResponse.json({
      success: true,
      data: {
        auction: transformedAuction,
        bids: transformedBids,
        bidCount: transformedBids.length
      }
    })
    
  } catch (error) {
    console.error('Error fetching auction details:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch auction details',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    )
  }
}