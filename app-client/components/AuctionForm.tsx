'use client'

import { useState } from 'react'
import { useAccount } from 'wagmi'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useCreateAuction } from '@/lib/hooks/useAuction'
import { Loader2, Clock, DollarSign, Gavel } from 'lucide-react'
import toast from 'react-hot-toast'
import Image from 'next/image'

interface AuctionFormProps {
  isOpen: boolean
  onClose: () => void
  nftContract: string
  tokenId: string
  nftName: string
  nftImage: string
  onSuccess?: () => void
}

const DURATION_OPTIONS = [
  { label: '1 Hour', value: 3600 },
  { label: '6 Hours', value: 21600 },
  { label: '12 Hours', value: 43200 },
  { label: '1 Day', value: 86400 },
  { label: '3 Days', value: 259200 },
  { label: '7 Days', value: 604800 },
]

export function AuctionForm({
  isOpen,
  onClose,
  nftContract,
  tokenId,
  nftName,
  nftImage,
  onSuccess,
}: AuctionFormProps) {
  const { address } = useAccount()
  const [startingBid, setStartingBid] = useState('')
  const [duration, setDuration] = useState<number>(86400)
  const [reservePrice, setReservePrice] = useState('')
  const [step, setStep] = useState<'form' | 'confirm' | 'success'>('form')
  const [auctionId, setAuctionId] = useState<string | null>(null)

  const {
    createAuction,
    isLoading,
    error
  } = useCreateAuction({
    onSuccess: (auctionId, transactionHash) => {
      setAuctionId(auctionId)
      setStep('success')
      toast.success('Auction created successfully!')
    },
    onError: (error) => {
      toast.error('Failed to create auction')
    }
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!address) {
      toast.error('Please connect your wallet')
      return
    }

    if (!startingBid || isNaN(Number(startingBid)) || Number(startingBid) <= 0) {
      toast.error('Please enter a valid starting bid')
      return
    }

    setStep('confirm')
  }

  const handleConfirm = async () => {
    await createAuction(nftContract, tokenId, startingBid, duration)
  }

  const handleClose = () => {
    if (step === 'success') {
      onSuccess?.()
    }
    setStep('form')
    setStartingBid('')
    setDuration(86400)
    setReservePrice('')
    setAuctionId(null)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Gavel className="w-5 h-5" />
            Create Auction
          </h2>
          <Button variant="ghost" size="sm" onClick={handleClose}>
            ×
          </Button>
        </div>

        {step === 'form' && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden">
                    <Image src={nftImage} alt={nftName} fill className="object-cover" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{nftName}</h3>
                    <p className="text-sm text-muted-foreground">Token #{tokenId}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-2">
              <Label htmlFor="startingBid" className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Starting Bid (ETH) *
              </Label>
              <Input
                id="startingBid"
                type="number"
                step="0.001"
                min="0"
                placeholder="0.1"
                value={startingBid}
                onChange={(e) => setStartingBid(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Auction Duration *
              </Label>
              <Select value={duration.toString()} onValueChange={(value) => setDuration(Number(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DURATION_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value.toString()}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                Review Auction
              </Button>
            </div>
          </form>
        )}

        {step === 'confirm' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Confirm Auction Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>NFT:</span>
                  <span>{nftName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Starting Bid:</span>
                  <span>{startingBid} ETH</span>
                </div>
                <div className="flex justify-between">
                  <span>Duration:</span>
                  <span>{DURATION_OPTIONS.find(opt => opt.value === duration)?.label}</span>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setStep('form')} className="flex-1">
                Back
              </Button>
              <Button onClick={handleConfirm} disabled={isLoading} className="flex-1">
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Auction'}
              </Button>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
              <Gavel className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Auction Created!</h3>
              <p className="text-muted-foreground">Your NFT is now available for bidding.</p>
            </div>
            <Button onClick={handleClose} className="w-full">Close</Button>
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">Error: {error.message}</p>
          </div>
        )}
      </div>
    </div>
  )
}