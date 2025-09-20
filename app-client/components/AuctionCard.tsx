'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useAccount } from 'wagmi'
import { Card, CardContent, CardFooter, CardHeader } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Heart, ExternalLink, Gavel, Loader2, TrendingUp } from 'lucide-react'
import { CountdownTimer } from './CountdownTimer'
import { BiddingModal } from './BiddingModal'
import { useAuctionDetails, useEndAuction } from '@/lib/hooks/useAuction'
import { MarketplaceAuction } from '@/lib/contracts'
import toast from 'react-hot-toast'

interface AuctionCardProps {
  auction: MarketplaceAuction
  name?: string
  description?: string
  image?: string
  ownerName?: string
  ownerAvatar?: string
  likes?: number
  onLike?: () => void
  onAuctionEnd?: () => void
}

export function AuctionCard({
  auction,
  name,
  description,
  image,
  ownerName,
  ownerAvatar,
  likes = 0,
  onLike,
  onAuctionEnd,
}: AuctionCardProps) {
  const { address } = useAccount()
  const [showBiddingModal, setShowBiddingModal] = useState(false)
  const [isAuctionEnded, setIsAuctionEnded] = useState(false)
  
  // Refresh auction details periodically for real-time updates
  const { auction: liveAuction, refetch } = useAuctionDetails(auction.auctionId)
  const currentAuction = liveAuction || auction

  const {
    endAuction,
    isLoading: isEndingAuction,
    error: endAuctionError
  } = useEndAuction({
    onSuccess: () => {
      toast.success('Auction ended successfully!')
      onAuctionEnd?.()
      refetch()
    },
    onError: (error) => {
      toast.error('Failed to end auction')
    }
  })

  // Poll for updates every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refetch()
    }, 30000)

    return () => clearInterval(interval)
  }, [refetch])

  // Check if auction has ended
  useEffect(() => {
    const now = Math.floor(Date.now() / 1000)
    setIsAuctionEnded(now >= currentAuction.endTime)
  }, [currentAuction.endTime])

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const isOwner = address && currentAuction.seller.toLowerCase() === address.toLowerCase()
  const isHighestBidder = address && currentAuction.highestBidder.toLowerCase() === address.toLowerCase()
  const hasHighestBid = Number(currentAuction.highestBid) > 0

  const handleEndAuction = async () => {
    if (!isAuctionEnded) {
      toast.error('Auction has not ended yet')
      return
    }
    await endAuction(currentAuction.auctionId)
  }

  const handleBidSuccess = () => {
    setShowBiddingModal(false)
    refetch()
    toast.success('Bid placed successfully!')
  }

  const getActionButton = () => {
    if (isAuctionEnded && isOwner && !currentAuction.isFinalized) {
      return (
        <Button 
          onClick={handleEndAuction}
          disabled={isEndingAuction}
          className="w-full"
        >
          {isEndingAuction ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Gavel className="w-4 h-4 mr-2" />
          )}
          {isEndingAuction ? 'Ending...' : 'End Auction'}
        </Button>
      )
    }

    if (isAuctionEnded || currentAuction.isFinalized) {
      return (
        <Button disabled className="w-full">
          <Gavel className="w-4 h-4 mr-2" />
          Auction Ended
        </Button>
      )
    }

    if (isOwner) {
      return (
        <Button disabled className="w-full" variant="outline">
          <Gavel className="w-4 h-4 mr-2" />
          Your Auction
        </Button>
      )
    }

    return (
      <Button 
        onClick={() => setShowBiddingModal(true)}
        className="w-full"
      >
        <TrendingUp className="w-4 h-4 mr-2" />
        Place Bid
      </Button>
    )
  }

  return (
    <>
      <Card className="group overflow-hidden hover:shadow-lg transition-shadow duration-200">
        <CardHeader className="p-0">
          <div className="relative aspect-square overflow-hidden">
            <Image
              src={image || '/placeholder-nft.png'}
              alt={name || `NFT #${currentAuction.tokenId}`}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-200"
            />
            <Badge className="absolute top-2 left-2 bg-orange-500 hover:bg-orange-600">
              <Gavel className="w-3 h-3 mr-1" />
              Auction
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 bg-background/80 hover:bg-background/90"
              onClick={onLike}
            >
              <Heart className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-4">
          <div className="space-y-3">
            <h3 className="text-lg font-semibold line-clamp-1">
              {name || `NFT #${currentAuction.tokenId}`}
            </h3>
            
            {description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {description}
              </p>
            )}
            
            <div className="flex items-center space-x-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={ownerAvatar} />
                <AvatarFallback className="text-xs">
                  {ownerName ? ownerName[0] : currentAuction.seller[0]}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-muted-foreground">
                {ownerName || formatAddress(currentAuction.seller)}
              </span>
            </div>

            {/* Auction Details */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  {hasHighestBid ? 'Current Bid' : 'Starting Bid'}
                </span>
                <span className="font-semibold">
                  {hasHighestBid ? currentAuction.highestBid : currentAuction.startingBid} ETH
                </span>
              </div>

              {hasHighestBid && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Highest Bidder</span>
                  <span className="text-sm font-medium">
                    {isHighestBidder ? 'You' : formatAddress(currentAuction.highestBidder)}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Time Left</span>
                <CountdownTimer 
                  endTime={currentAuction.endTime}
                  onEnd={() => {
                    setIsAuctionEnded(true)
                    onAuctionEnd?.()
                  }}
                />
              </div>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="p-4 pt-0 space-y-2">
          <div className="flex items-center justify-between w-full">
            {likes > 0 && (
              <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                <Heart className="w-4 h-4" />
                <span>{likes}</span>
              </div>
            )}
            
            <Button asChild variant="ghost" size="sm">
              <Link href={`/nft/${currentAuction.nftContract}-${currentAuction.tokenId}`}>
                <ExternalLink className="w-4 h-4 mr-1" />
                Details
              </Link>
            </Button>
          </div>
          
          {getActionButton()}
        </CardFooter>
      </Card>

      {/* Bidding Modal */}
      {showBiddingModal && (
        <BiddingModal
          isOpen={showBiddingModal}
          onClose={() => setShowBiddingModal(false)}
          auction={currentAuction}
          nftName={name || `NFT #${currentAuction.tokenId}`}
          nftImage={image || '/placeholder-nft.png'}
          onSuccess={handleBidSuccess}
        />
      )}
    </>
  )
}