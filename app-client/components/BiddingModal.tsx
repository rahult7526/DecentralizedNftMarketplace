'use client'

import { useState } from 'react'
import { useAccount } from 'wagmi'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { usePlaceBid } from '@/lib/hooks/useAuction'
import { MarketplaceAuction } from '@/lib/contracts'
import { Loader2, TrendingUp, DollarSign, X } from 'lucide-react'
import toast from 'react-hot-toast'
import Image from 'next/image'

interface BiddingModalProps {
  isOpen: boolean
  onClose: () => void
  auction: MarketplaceAuction
  nftName: string
  nftImage: string
  onSuccess?: () => void
}

export function BiddingModal({
  isOpen,
  onClose,
  auction,
  nftName,
  nftImage,
  onSuccess,
}: BiddingModalProps) {
  const { address } = useAccount()
  const [bidAmount, setBidAmount] = useState('')
  const [step, setStep] = useState<'form' | 'confirm' | 'success'>('form')

  const {
    placeBid,
    isLoading,
    error
  } = usePlaceBid({
    onSuccess: (transactionHash) => {
      console.log('Bid placed:', { transactionHash })
      setStep('success')
      toast.success('Bid placed successfully!')
    },
    onError: (error) => {
      console.error('Bid failed:', error)
      toast.error('Failed to place bid')
    }
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!address) {
      toast.error('Please connect your wallet')
      return
    }

    if (!bidAmount || isNaN(Number(bidAmount)) || Number(bidAmount) <= 0) {
      toast.error('Please enter a valid bid amount')
      return
    }

    // Check if bid is higher than current highest bid
    const currentHighest = Number(auction.highestBid) || Number(auction.startingBid)
    if (Number(bidAmount) <= currentHighest) {
      toast.error(`Bid must be higher than ${currentHighest} ETH`)
      return
    }

    // Check if auction has ended
    const now = Math.floor(Date.now() / 1000)
    if (now >= auction.endTime) {
      toast.error('Auction has ended')
      return
    }

    setStep('confirm')
  }

  const handleConfirm = async () => {
    await placeBid(auction.auctionId, bidAmount)
  }

  const handleClose = () => {
    if (step === 'success') {
      onSuccess?.()
    }
    setStep('form')
    setBidAmount('')
    onClose()
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const getCurrentHighest = () => {
    return Number(auction.highestBid) > 0 ? auction.highestBid : auction.startingBid
  }

  const getMinimumBid = () => {
    const current = Number(getCurrentHighest())
    return (current + 0.001).toFixed(3) // Minimum increment of 0.001 ETH
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Place Bid
          </h2>
          <Button variant="ghost" size="sm" onClick={handleClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {step === 'form' && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* NFT Preview */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden">
                    <Image
                      src={nftImage}
                      alt={nftName}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold">{nftName}</h3>
                    <p className="text-sm text-muted-foreground">
                      Token #{auction.tokenId}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Current Auction Info */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Current Highest:</span>
                  <span className="font-semibold">{getCurrentHighest()} ETH</span>
                </div>
                
                {auction.highestBidder && auction.highestBidder !== '0x0000000000000000000000000000000000000000' && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Current Bidder:</span>
                    <span className="text-sm">
                      {auction.highestBidder.toLowerCase() === address?.toLowerCase() 
                        ? 'You' 
                        : formatAddress(auction.highestBidder)
                      }
                    </span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Minimum Bid:</span>
                  <span className="font-medium text-green-600">{getMinimumBid()} ETH</span>
                </div>
              </CardContent>
            </Card>

            {/* Bid Amount Input */}
            <div className="space-y-2">
              <Label htmlFor="bidAmount" className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Your Bid Amount (ETH) *
              </Label>
              <Input
                id="bidAmount"
                type="number"
                step="0.001"
                min={getMinimumBid()}
                placeholder={getMinimumBid()}
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Must be higher than the current highest bid
              </p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                ⚠️ Your bid is binding. If you win, you must complete the purchase.
              </p>
            </div>

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                Review Bid
              </Button>
            </div>
          </form>
        )}

        {step === 'confirm' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Confirm Your Bid</CardTitle>
                <CardDescription>
                  Please review your bid details before submitting
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">NFT:</span>
                  <span className="font-medium">{nftName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Your Bid:</span>
                  <span className="font-semibold text-lg">{bidAmount} ETH</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Current Highest:</span>
                  <span className="font-medium">{getCurrentHighest()} ETH</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Your Advantage:</span>
                  <span className="font-medium text-green-600">
                    +{(Number(bidAmount) - Number(getCurrentHighest())).toFixed(3)} ETH
                  </span>
                </div>
              </CardContent>
            </Card>

            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800">
                🔒 This transaction cannot be reversed. Make sure you want to place this bid.
              </p>
            </div>

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setStep('form')} className="flex-1">
                Back
              </Button>
              <Button onClick={handleConfirm} disabled={isLoading} className="flex-1">
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Placing Bid...
                  </>
                ) : (
                  'Place Bid'
                )}
              </Button>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-2">Bid Placed Successfully!</h3>
              <p className="text-muted-foreground mb-4">
                You are now the highest bidder with {bidAmount} ETH
              </p>
              <div className="bg-muted/50 p-3 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  You'll be notified if someone outbids you. Good luck!
                </p>
              </div>
            </div>

            <Button onClick={handleClose} className="w-full">
              Close
            </Button>
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">
              Error: {error.message}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}