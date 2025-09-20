'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useAccount } from 'wagmi'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Heart, ExternalLink, ShoppingCart, Gavel, Tag, Loader2 } from 'lucide-react'
import { ListingModal } from './ListingModal'
import { AuctionForm } from './AuctionForm'
import { useBuyNFT } from '@/lib/hooks/useMarketplace'
import toast from 'react-hot-toast'

interface NFTCardProps {
  id: string
  name: string
  description?: string
  image: string
  tokenId: string
  nftContract: string
  price?: string
  owner: string
  ownerName?: string
  ownerAvatar?: string
  isListed?: boolean
  listingId?: string
  isAuction?: boolean
  timeLeft?: string
  highestBid?: string
  likes?: number
  onMint?: () => void
  onList?: () => void
  onBid?: () => void
  onLike?: () => void
  onSaleComplete?: () => void
}

export function NFTCard({
  id,
  name,
  description,
  image,
  tokenId,
  nftContract,
  price,
  owner,
  ownerName,
  ownerAvatar,
  isListed = false,
  listingId,
  isAuction = false,
  timeLeft,
  highestBid,
  likes = 0,
  onMint,
  onList,
  onBid,
  onLike,
  onSaleComplete,
}: NFTCardProps) {
  const { address } = useAccount()
  const [showListingModal, setShowListingModal] = useState(false)
  const [showAuctionForm, setShowAuctionForm] = useState(false)
  
  const {
    buyNFT,
    isLoading: isBuying,
    error: buyError
  } = useBuyNFT({
    onSuccess: () => {
      toast.success('NFT purchased successfully!')
      onSaleComplete?.()
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to purchase NFT')
    }
  })

  const formatAddress = (addressToFormat: string) => {
    return `${addressToFormat.slice(0, 6)}...${addressToFormat.slice(-4)}`
  }

  const isOwner = address && owner.toLowerCase() === address.toLowerCase()

  const handleBuyNow = async () => {
    if (!listingId || !price) {
      toast.error('Invalid listing data')
      return
    }
    
    try {
      await buyNFT(listingId, price)
    } catch (error) {
      console.error('Buy NFT error:', error)
    }
  }

  const getActionButton = () => {
    // Custom action buttons (for minting, etc.)
    if (onMint) {
      return (
        <Button onClick={onMint} className="w-full">
          <Gavel className="w-4 h-4 mr-2" />
          Mint
        </Button>
      )
    }
    
    if (onList) {
      return (
        <Button onClick={onList} variant="outline" className="w-full">
          <ShoppingCart className="w-4 h-4 mr-2" />
          List for Sale
        </Button>
      )
    }
    
    if (onBid) {
      return (
        <Button onClick={onBid} className="w-full">
          <Gavel className="w-4 h-4 mr-2" />
          Place Bid
        </Button>
      )
    }

    // Marketplace functionality
    if (isOwner && !isListed) {
      return (
        <div className="flex gap-2">
          <Button 
            onClick={() => setShowListingModal(true)} 
            variant="outline" 
            className="flex-1"
          >
            <Tag className="w-4 h-4 mr-2" />
            List for Sale
          </Button>
          <Button 
            onClick={() => setShowAuctionForm(true)} 
            className="flex-1"
          >
            <Gavel className="w-4 h-4 mr-2" />
            Start Auction
          </Button>
        </div>
      )
    }

    if (isListed && !isOwner) {
      return (
        <Button 
          onClick={handleBuyNow}
          disabled={isBuying}
          className="w-full"
        >
          {isBuying ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <ShoppingCart className="w-4 h-4 mr-2" />
          )}
          {isBuying ? 'Buying...' : 'Buy Now'}
        </Button>
      )
    }
    
    return (
      <Button asChild className="w-full">
        <Link href={`/nft/${id}`}>
          <ExternalLink className="w-4 h-4 mr-2" />
          View Details
        </Link>
      </Button>
    )
  }

  return (
    <>
      <Card className="group overflow-hidden hover:shadow-lg transition-shadow duration-200">
        <CardHeader className="p-0">
          <div className="relative aspect-square overflow-hidden">
            <Image
              src={image}
              alt={name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-200"
            />
            {isAuction && (
              <Badge className="absolute top-2 left-2 bg-red-500 hover:bg-red-600">
                Auction
              </Badge>
            )}
            {isListed && (
              <Badge className="absolute top-2 left-2 bg-green-500 hover:bg-green-600">
                For Sale
              </Badge>
            )}
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
          <div className="space-y-2">
            <CardTitle className="text-lg line-clamp-1">{name}</CardTitle>
            {description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {description}
              </p>
            )}
            
            <div className="flex items-center space-x-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={ownerAvatar} />
                <AvatarFallback className="text-xs">
                  {ownerName ? ownerName[0] : owner[0]}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-muted-foreground">
                {ownerName || formatAddress(owner)}
              </span>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="p-4 pt-0 space-y-2">
          <div className="flex items-center justify-between w-full">
            {isAuction ? (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Highest Bid</p>
                <p className="font-semibold">{highestBid || 'No bids'}</p>
                {timeLeft && (
                  <p className="text-xs text-muted-foreground">{timeLeft}</p>
                )}
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Price</p>
                <p className="font-semibold">{price || 'Not for sale'}</p>
              </div>
            )}
            
            {likes > 0 && (
              <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                <Heart className="w-4 h-4" />
                <span>{likes}</span>
              </div>
            )}
          </div>
          
          {getActionButton()}
        </CardFooter>
      </Card>

      {/* Listing Modal */}
      {showListingModal && tokenId && nftContract && (
        <ListingModal
          isOpen={showListingModal}
          onClose={() => setShowListingModal(false)}
          nftData={{
            id: id,
            name: name,
            image: image,
            tokenId: tokenId,
            nftContract: nftContract,
            currentOwner: owner
          }}
          onSuccess={() => {
            setShowListingModal(false)
            onSaleComplete?.()
          }}
        />
      )}

      {/* Auction Form */}
      {showAuctionForm && tokenId && nftContract && (
        <AuctionForm
          isOpen={showAuctionForm}
          onClose={() => setShowAuctionForm(false)}
          nftContract={nftContract}
          tokenId={tokenId}
          nftName={name}
          nftImage={image}
          onSuccess={() => {
            setShowAuctionForm(false)
            onSaleComplete?.()
          }}
        />
      )}
    </>
  )
}
