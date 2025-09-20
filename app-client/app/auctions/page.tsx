'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { useMarketplaceAuctions, useAuctionDetails } from '@/lib/hooks/useAuction'
import { AuctionCard } from '@/components/AuctionCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Search, Filter, RefreshCw, Gavel } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AuctionsPage() {
  const { address } = useAccount()
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('ending-soon')
  const [filterBy, setFilterBy] = useState('all')
  
  const {
    auctionIds,
    isLoading,
    error,
    refetch
  } = useMarketplaceAuctions()

  const [allAuctions, setAllAuctions] = useState<any[]>([])
  const [filteredAuctions, setFilteredAuctions] = useState<any[]>([])

  // Fetch individual auction details for each auction ID
  useEffect(() => {
    const fetchAuctionDetails = async () => {
      if (!auctionIds || auctionIds.length === 0) return

      const auctionPromises = auctionIds.map(async (auction) => {
        // This would normally use useAuctionDetails hook for each auction
        // For now, we'll create mock data
        return {
          auctionId: auction.auctionId,
          nftContract: '0x...', // This would come from contract
          tokenId: Math.floor(Math.random() * 1000).toString(),
          seller: '0x1234567890123456789012345678901234567890',
          startingBid: '0.1',
          highestBid: '0.5',
          highestBidder: '0x9876543210987654321098765432109876543210',
          endTime: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
          isActive: true,
          isFinalized: false,
          createdAt: Math.floor(Date.now() / 1000) - 7200, // 2 hours ago
        }
      })

      const auctionDetails = await Promise.all(auctionPromises)
      setAllAuctions(auctionDetails)
    }

    fetchAuctionDetails()
  }, [auctionIds])

  // Filter and sort auctions
  useEffect(() => {
    if (!allAuctions) return

    let filtered = [...allAuctions]

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(auction =>
        auction.tokenId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        auction.nftContract.toLowerCase().includes(searchTerm.toLowerCase()) ||
        auction.seller.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply category filter
    if (filterBy !== 'all') {
      if (filterBy === 'my-auctions' && address) {
        filtered = filtered.filter(auction => 
          auction.seller.toLowerCase() === address.toLowerCase()
        )
      } else if (filterBy === 'my-bids' && address) {
        filtered = filtered.filter(auction => 
          auction.highestBidder.toLowerCase() === address.toLowerCase()
        )
      } else if (filterBy === 'ending-soon') {
        const nextHour = Math.floor(Date.now() / 1000) + 3600
        filtered = filtered.filter(auction => auction.endTime <= nextHour)
      }
    }

    // Apply sorting
    switch (sortBy) {
      case 'ending-soon':
        filtered.sort((a, b) => a.endTime - b.endTime)
        break
      case 'newest':
        filtered.sort((a, b) => b.createdAt - a.createdAt)
        break
      case 'highest-bid':
        filtered.sort((a, b) => parseFloat(b.highestBid) - parseFloat(a.highestBid))
        break
      case 'lowest-bid':
        filtered.sort((a, b) => parseFloat(a.highestBid) - parseFloat(b.highestBid))
        break
      default:
        break
    }

    setFilteredAuctions(filtered)
  }, [allAuctions, searchTerm, sortBy, filterBy, address])

  const handleRefresh = async () => {
    try {
      await refetch()
      toast.success('Auctions refreshed')
    } catch (error) {
      toast.error('Failed to refresh auctions')
    }
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-red-500">Error Loading Auctions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              {error.message || 'Failed to load auction listings'}
            </p>
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
          <Gavel className="w-10 h-10" />
          NFT Auctions
        </h1>
        <p className="text-muted-foreground">
          Bid on exclusive NFTs and discover unique digital assets
        </p>
      </div>

      {/* Search and Filters */}
      <div className="mb-8 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search auctions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ending-soon">Ending Soon</SelectItem>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="highest-bid">Highest Bid</SelectItem>
              <SelectItem value="lowest-bid">Lowest Bid</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterBy} onValueChange={setFilterBy}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Auctions</SelectItem>
              <SelectItem value="ending-soon">Ending Soon</SelectItem>
              {address && (
                <>
                  <SelectItem value="my-auctions">My Auctions</SelectItem>
                  <SelectItem value="my-bids">My Bids</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
          <Button onClick={handleRefresh} variant="outline" size="icon">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Results Count */}
      {!isLoading && (
        <div className="mb-6">
          <p className="text-sm text-muted-foreground">
            {filteredAuctions.length} {filteredAuctions.length === 1 ? 'auction' : 'auctions'} found
          </p>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <div className="aspect-square">
                <Skeleton className="w-full h-full" />
              </div>
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <div className="flex items-center space-x-2">
                  <Skeleton className="h-6 w-6 rounded-full" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
                <div className="pt-2">
                  <Skeleton className="h-4 w-1/4 mb-1" />
                  <Skeleton className="h-6 w-1/2" />
                </div>
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredAuctions.length === 0 && (
        <Card className="max-w-md mx-auto">
          <CardContent className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
              <Gavel className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No Auctions Found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || filterBy !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'No NFT auctions are currently active'
              }
            </p>
            {(searchTerm || filterBy !== 'all') && (
              <Button 
                onClick={() => {
                  setSearchTerm('')
                  setFilterBy('all')
                }} 
                variant="outline"
              >
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Auction Grid */}
      {!isLoading && filteredAuctions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredAuctions.map((auction) => (
            <AuctionCard
              key={auction.auctionId}
              auction={auction}
              name={`NFT #${auction.tokenId}`}
              description={`Auction from ${auction.nftContract.slice(0, 10)}...`}
              image="/placeholder-nft.png"
              onAuctionEnd={handleRefresh}
            />
          ))}
        </div>
      )}
    </div>
  )
}