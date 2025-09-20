import { NextRequest, NextResponse } from 'next/server'
import { DatabaseService } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userAddress = searchParams.get('user')
    
    if (!userAddress) {
      return NextResponse.json(
        { success: false, error: 'User address is required' },
        { status: 400 }
      )
    }
    
    // Get user's bids
    const userBids = await DatabaseService.getUserBids(userAddress)
    
    // Transform data
    const transformedBids = userBids.map((item: any) => ({
      id: item.id,
      auctionId: item.auction_id,
      bidder: item.bidder_address,
      amount: item.bid_amount,
      createdAt: item.created_at,
      transactionHash: item.transaction_hash,
      auction: {
        auctionId: item.auctions.auction_id,
        nftContract: item.auctions.nft_contract_address,
        tokenId: item.auctions.token_id,
        status: item.auctions.status,
        endTime: item.auctions.end_time
      }
    }))
    
    return NextResponse.json({
      success: true,
      data: transformedBids,
      total: transformedBids.length
    })
    
  } catch (error) {
    console.error('Error fetching user bids:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch user bids',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    )
  }
}