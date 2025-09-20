'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { useMarketplaceListingsAPI, useSearchListingsAPI } from '@/lib/hooks/useMarketplaceAPI'
import { NFTCard } from '@/components/NFTCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Search, Filter, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'

export default function MarketplacePage() {
  const { address } = useAccount()
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const [filterBy, setFilterBy] = useState('all')
  
  const {
    listings,
    pagination,
    isLoading,
    error,
    refetch
  } = useSearchListingsAPI(searchTerm, {
    limit: 50,
    sortBy,
    seller: filterBy === 'my-listings' && address ? address : undefined,
    minPrice: undefined, // Could add price filters here
    maxPrice: undefined
  })

  const [filteredListings, setFilteredListings] = useState(listings || [])

  // Update filtered listings when API data changes
  useEffect(() => {
    setFilteredListings(listings || [])
  }, [listings])

  const handleRefresh = async () => {
    try {
      await refetch()
      toast.success('Marketplace refreshed')
    } catch (error) {
      toast.error('Failed to refresh marketplace')
    }
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-red-500">Error Loading Marketplace</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              {error.message || 'Failed to load marketplace listings'}
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
        <h1 className="text-4xl font-bold mb-2">NFT Marketplace</h1>
        <p className="text-muted-foreground">
          Discover, buy, and sell unique digital assets
        </p>
      </div>

      {/* Search and Filters */}
      <div className="mb-8 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search NFTs..."
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
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterBy} onValueChange={setFilterBy}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Items</SelectItem>
              {address && (
                <SelectItem value="my-listings">My Listings</SelectItem>
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
            {filteredListings.length} {filteredListings.length === 1 ? 'item' : 'items'} found
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
      {!isLoading && filteredListings.length === 0 && (
        <Card className="max-w-md mx-auto">
          <CardContent className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
              <Filter className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No NFTs Found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || filterBy !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'No NFTs are currently listed for sale'
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

      {/* NFT Grid */}
      {!isLoading && filteredListings.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredListings.map((listing) => (
            <NFTCard
              key={`${listing.nftContract}-${listing.tokenId}`}
              id={`${listing.nftContract}-${listing.tokenId}`}
              name={`NFT #${listing.tokenId}`}
              description={`From contract ${listing.nftContract.slice(0, 10)}...`}
              image={'/placeholder-nft.png'}
              tokenId={listing.tokenId}
              nftContract={listing.nftContract}
              price={`${listing.price} ETH`}
              owner={listing.seller}
              isListed={true}
              listingId={listing.listingId}
              onSaleComplete={handleRefresh}
            />
          ))}
        </div>
      )}
    </div>
  )
}