'use client'

import { useState, useEffect } from 'react'
import useSWR from 'swr'

// API fetcher function
const fetcher = async (url: string) => {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error('Failed to fetch')
  }
  return response.json()
}

// Types for API responses
export interface APIListing {
  listingId: string
  nftContract: string
  tokenId: string
  seller: string
  price: string
  currency: string
  status: string
  createdAt: string
  metadata?: any
  transactionHash: string
  blockNumber: number
}

export interface APIAuction {
  auctionId: string
  nftContract: string
  tokenId: string
  seller: string
  startingBid: string
  currentBid: string
  currentBidder?: string
  reservePrice?: string
  startTime: string
  endTime: string
  status: string
  isFinalized: boolean
  createdAt: string
  metadata?: any
  transactionHash: string
  blockNumber: number
}

export interface APIBid {
  id: string
  auctionId: string
  bidder: string
  amount: string
  createdAt: string
  transactionHash: string
  blockNumber: number
}

export interface MarketplaceStats {
  activeListings: number
  activeAuctions: number
  volume24h: string
  recentSalesCount: number
}

// Hook for fetching marketplace listings
export function useMarketplaceListingsAPI(params: {
  limit?: number
  offset?: number
  search?: string
  minPrice?: string
  maxPrice?: string
  seller?: string
  sortBy?: string
} = {}) {
  const queryParams = new URLSearchParams()
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      queryParams.append(key, value.toString())
    }
  })
  
  const url = `/api/market/listings?${queryParams.toString()}`
  
  const { data, error, isLoading, mutate } = useSWR(url, fetcher, {
    refreshInterval: 30000, // Refresh every 30 seconds
    revalidateOnFocus: true
  })
  
  return {
    listings: data?.data as APIListing[] || [],
    pagination: data?.pagination,
    isLoading,
    error,
    refetch: mutate
  }
}

// Hook for fetching marketplace auctions
export function useMarketplaceAuctionsAPI(params: {
  limit?: number
  offset?: number
  status?: string
  seller?: string
  endingSoon?: boolean
  hours?: number
} = {}) {
  const queryParams = new URLSearchParams()
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      queryParams.append(key, value.toString())
    }
  })
  
  const url = `/api/market/auctions?${queryParams.toString()}`
  
  const { data, error, isLoading, mutate } = useSWR(url, fetcher, {
    refreshInterval: 10000, // Refresh every 10 seconds for auctions
    revalidateOnFocus: true
  })
  
  return {
    auctions: data?.data as APIAuction[] || [],
    pagination: data?.pagination,
    isLoading,
    error,
    refetch: mutate
  }
}

// Hook for fetching specific auction details
export function useAuctionDetailsAPI(auctionId: string | null) {
  const url = auctionId ? `/api/market/auctions/${auctionId}` : null
  
  const { data, error, isLoading, mutate } = useSWR(url, fetcher, {
    refreshInterval: 5000, // Refresh every 5 seconds for live auctions
    revalidateOnFocus: true
  })
  
  return {
    auction: data?.data?.auction as APIAuction || null,
    bids: data?.data?.bids as APIBid[] || [],
    bidCount: data?.data?.bidCount || 0,
    isLoading,
    error,
    refetch: mutate
  }
}

// Hook for fetching user bids
export function useUserBidsAPI(userAddress: string | null) {
  const url = userAddress ? `/api/market/bids?user=${userAddress}` : null
  
  const { data, error, isLoading, mutate } = useSWR(url, fetcher, {
    refreshInterval: 30000,
    revalidateOnFocus: true
  })
  
  return {
    bids: data?.data || [],
    total: data?.total || 0,
    isLoading,
    error,
    refetch: mutate
  }
}

// Hook for fetching marketplace statistics
export function useMarketplaceStatsAPI() {
  const { data, error, isLoading, mutate } = useSWR('/api/market/stats', fetcher, {
    refreshInterval: 60000, // Refresh every minute
    revalidateOnFocus: true
  })
  
  return {
    stats: data?.data as MarketplaceStats || null,
    isLoading,
    error,
    refetch: mutate
  }
}

// Hook for live auction updates (combines auction details with real-time updates)
export function useLiveAuctionAPI(auctionId: string | null) {
  const [lastUpdate, setLastUpdate] = useState(Date.now())
  const { auction, bids, bidCount, isLoading, error, refetch } = useAuctionDetailsAPI(auctionId)
  
  // Force refresh every 5 seconds for live auctions
  useEffect(() => {
    if (!auctionId) return
    
    const interval = setInterval(() => {
      refetch()
      setLastUpdate(Date.now())
    }, 5000)
    
    return () => clearInterval(interval)
  }, [auctionId, refetch])
  
  return {
    auction,
    bids,
    bidCount,
    isLoading,
    error,
    refetch,
    lastUpdate
  }
}

// Hook for searching listings with debounced search
export function useSearchListingsAPI(searchTerm: string, filters: any = {}) {
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm)
  
  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm)
    }, 300)
    
    return () => clearTimeout(timer)
  }, [searchTerm])
  
  return useMarketplaceListingsAPI({
    search: debouncedSearch,
    ...filters
  })
}

// Hook for ending soon auctions
export function useEndingSoonAuctionsAPI(hours = 24) {
  return useMarketplaceAuctionsAPI({
    endingSoon: true,
    hours
  })
}