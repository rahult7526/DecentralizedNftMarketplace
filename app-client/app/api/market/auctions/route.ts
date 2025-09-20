import { NextRequest, NextResponse } from 'next/server'
import { DatabaseService } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Parse query parameters
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const status = searchParams.get('status') || 'ACTIVE'
    const seller = searchParams.get('seller')
    const endingSoon = searchParams.get('endingSoon') === 'true'
    
    let auctions
    
    if (endingSoon) {
      const hours = parseInt(searchParams.get('hours') || '24')
      auctions = await DatabaseService.getEndingSoonAuctions(hours)
    } else {
      auctions = await DatabaseService.getActiveAuctions(limit, offset)
    }
    
    // Filter by seller if provided
    if (seller) {
      auctions = auctions.filter(auction => 
        auction.seller_address.toLowerCase() === seller.toLowerCase()
      )
    }
    
    // Filter by status if not default
    if (status !== 'ACTIVE') {
      auctions = auctions.filter(auction => auction.status === status)
    }
    
    // Transform data for frontend
    const transformedAuctions = auctions.map(auction => ({
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
    }))
    
    return NextResponse.json({
      success: true,
      data: transformedAuctions,
      pagination: {
        limit,
        offset,
        total: transformedAuctions.length,
        hasMore: transformedAuctions.length === limit
      }
    })
    
  } catch (error) {
    console.error('Error fetching auctions:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch auctions',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    )
  }
}