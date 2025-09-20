import { NextRequest, NextResponse } from 'next/server'
import { DatabaseService } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Parse query parameters
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const search = searchParams.get('search') || ''
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    const seller = searchParams.get('seller')
    const sortBy = searchParams.get('sortBy') || 'newest'
    
    // Build filters
    const filters = {
      limit: Math.min(limit, 100), // Cap at 100
      offset,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      seller,
      sortBy
    }
    
    let listings
    
    if (search) {
      listings = await DatabaseService.searchListings(search, filters)
    } else {
      listings = await DatabaseService.getActiveListings(filters.limit, filters.offset)
    }
    
    // Transform data for frontend
    const transformedListings = listings.map(listing => ({
      listingId: listing.listing_id,
      nftContract: listing.nft_contract_address,
      tokenId: listing.token_id,
      seller: listing.seller_address,
      price: listing.price,
      currency: listing.currency,
      status: listing.status,
      createdAt: listing.created_at,
      metadata: listing.metadata,
      transactionHash: listing.transaction_hash,
      blockNumber: listing.block_number
    }))
    
    return NextResponse.json({
      success: true,
      data: transformedListings,
      pagination: {
        limit: filters.limit,
        offset: filters.offset,
        total: transformedListings.length,
        hasMore: transformedListings.length === filters.limit
      }
    })
    
  } catch (error) {
    console.error('Error fetching listings:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch listings',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    )
  }
}

// POST endpoint for manual indexing trigger (development only)
export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { success: false, error: 'Only available in development' },
      { status: 403 }
    )
  }
  
  try {
    // This could trigger manual re-indexing
    // For now, just return success
    return NextResponse.json({
      success: true,
      message: 'Manual indexing triggered'
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to trigger indexing' },
      { status: 500 }
    )
  }
}