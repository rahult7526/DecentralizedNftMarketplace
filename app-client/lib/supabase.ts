import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Client for frontend (uses anon key)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Admin client for server-side operations (uses service role key)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

// Database types
export interface DatabaseListing {
  id: string
  listing_id: string
  nft_contract_address: string
  token_id: string
  seller_address: string
  price: string
  currency: string
  listing_type: 'FIXED_PRICE' | 'AUCTION'
  status: 'ACTIVE' | 'SOLD' | 'CANCELLED'
  created_at: string
  updated_at: string
  sold_at?: string
  sold_to?: string
  transaction_hash: string
  block_number: number
  metadata?: any
}

export interface DatabaseAuction {
  id: string
  auction_id: string
  nft_contract_address: string
  token_id: string
  seller_address: string
  starting_bid: string
  current_bid: string
  current_bidder?: string
  reserve_price?: string
  start_time: string
  end_time: string
  status: 'ACTIVE' | 'ENDED' | 'CANCELLED'
  is_finalized: boolean
  created_at: string
  updated_at: string
  transaction_hash: string
  block_number: number
  metadata?: any
}

export interface DatabaseBid {
  id: string
  auction_id: string
  bidder_address: string
  bid_amount: string
  created_at: string
  transaction_hash: string
  block_number: number
}

export interface EventProcessing {
  id: string
  contract_address: string
  event_name: string
  last_processed_block: number
  last_processed_at: string
}

// Database helper functions
export class DatabaseService {
  
  // Listings
  static async getActiveListings(limit = 50, offset = 0) {
    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .eq('status', 'ACTIVE')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
    
    if (error) throw error
    return data as DatabaseListing[]
  }

  static async getListingByTokenId(nftContract: string, tokenId: string) {
    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .eq('nft_contract_address', nftContract)
      .eq('token_id', tokenId)
      .eq('status', 'ACTIVE')
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    return data as DatabaseListing | null
  }

  static async searchListings(query: string, filters: any = {}) {
    let queryBuilder = supabase
      .from('listings')
      .select('*')
      .eq('status', 'ACTIVE')

    if (query) {
      queryBuilder = queryBuilder.or(`token_id.ilike.%${query}%,seller_address.ilike.%${query}%`)
    }

    if (filters.minPrice) {
      queryBuilder = queryBuilder.gte('price', filters.minPrice)
    }

    if (filters.maxPrice) {
      queryBuilder = queryBuilder.lte('price', filters.maxPrice)
    }

    if (filters.seller) {
      queryBuilder = queryBuilder.eq('seller_address', filters.seller)
    }

    const { data, error } = await queryBuilder
      .order('created_at', { ascending: false })
      .limit(filters.limit || 50)
    
    if (error) throw error
    return data as DatabaseListing[]
  }

  // Auctions
  static async getActiveAuctions(limit = 50, offset = 0) {
    const { data, error } = await supabase
      .from('auctions')
      .select('*')
      .eq('status', 'ACTIVE')
      .order('end_time', { ascending: true })
      .range(offset, offset + limit - 1)
    
    if (error) throw error
    return data as DatabaseAuction[]
  }

  static async getAuctionById(auctionId: string) {
    const { data, error } = await supabase
      .from('auctions')
      .select('*')
      .eq('auction_id', auctionId)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    return data as DatabaseAuction | null
  }

  static async getEndingSoonAuctions(hoursFromNow = 24) {
    const endTime = new Date()
    endTime.setHours(endTime.getHours() + hoursFromNow)
    
    const { data, error } = await supabase
      .from('auctions')
      .select('*')
      .eq('status', 'ACTIVE')
      .lte('end_time', endTime.toISOString())
      .order('end_time', { ascending: true })
    
    if (error) throw error
    return data as DatabaseAuction[]
  }

  // Bids
  static async getAuctionBids(auctionId: string) {
    const { data, error } = await supabase
      .from('bids')
      .select('*')
      .eq('auction_id', auctionId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data as DatabaseBid[]
  }

  static async getUserBids(userAddress: string) {
    const { data, error } = await supabase
      .from('bids')
      .select(`
        *,
        auctions!inner(
          auction_id,
          nft_contract_address,
          token_id,
          status,
          end_time
        )
      `)
      .eq('bidder_address', userAddress)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  }

  // Statistics
  static async getMarketplaceStats() {
    const { data: totalListings } = await supabase
      .from('listings')
      .select('id', { count: 'exact' })
      .eq('status', 'ACTIVE')

    const { data: totalAuctions } = await supabase
      .from('auctions')
      .select('id', { count: 'exact' })
      .eq('status', 'ACTIVE')

    const { data: recentSales } = await supabase
      .from('listings')
      .select('price')
      .eq('status', 'SOLD')
      .gte('sold_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

    const totalVolume = recentSales?.reduce((sum: number, sale: any) => sum + parseFloat(sale.price), 0) || 0

    return {
      activeListings: totalListings?.length || 0,
      activeAuctions: totalAuctions?.length || 0,
      volume24h: totalVolume.toString(),
      recentSalesCount: recentSales?.length || 0
    }
  }
}

export default supabase