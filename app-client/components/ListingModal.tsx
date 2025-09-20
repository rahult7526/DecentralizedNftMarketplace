'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Badge } from './ui/badge'
import { 
  DollarSign,
  Loader2,
  AlertCircle,
  Check,
  X,
  Tag
} from 'lucide-react'
import { useListNFT } from '@/lib/hooks/useMarketplace'
import { formatEther } from 'viem'
import toast from 'react-hot-toast'

interface ListingModalProps {
  nftData: {
    id: string
    name: string
    image: string
    tokenId: string
    nftContract: string
    currentOwner: string
  }
  isOpen: boolean
  onClose: () => void
  onSuccess?: (listingId: string, transactionHash: string) => void
}

export function ListingModal({ nftData, isOpen, onClose, onSuccess }: ListingModalProps) {
  const [price, setPrice] = useState('')
  const [step, setStep] = useState<'input' | 'confirming' | 'success' | 'error'>('input')
  const [result, setResult] = useState<{ listingId: string; transactionHash: string } | null>(null)

  const { listNFT, isLoading, error } = useListNFT({
    onSuccess: (listingId, transactionHash) => {
      setResult({ listingId, transactionHash })
      setStep('success')
      onSuccess?.(listingId, transactionHash)
    },
    onError: (error) => {
      console.error('Listing error:', error)
      setStep('error')
    }
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!price || isNaN(Number(price)) || Number(price) <= 0) {
      toast.error('Please enter a valid price')
      return
    }

    setStep('confirming')
    await listNFT(nftData.nftContract, nftData.tokenId, price)
  }

  const resetModal = () => {
    setPrice('')
    setStep('input')
    setResult(null)
  }

  const handleClose = () => {
    resetModal()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <Card className="border-0 shadow-2xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Tag className="w-5 h-5" />
                List NFT for Sale
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={handleClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <CardDescription>
              Set a price for your NFT and list it on the marketplace
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* NFT Preview */}
            <div className="flex items-center space-x-4 p-4 bg-muted rounded-lg">
              <img
                src={nftData.image}
                alt={nftData.name}
                className="w-16 h-16 rounded-lg object-cover"
              />
              <div>
                <h3 className="font-semibold">{nftData.name}</h3>
                <p className="text-sm text-muted-foreground">Token #{nftData.tokenId}</p>
              </div>
            </div>

            {/* Step Indicators */}
            <div className="flex items-center gap-2">
              <Badge variant={step === 'input' ? 'default' : 'secondary'}>
                1. Set Price
              </Badge>
              <Badge variant={step === 'confirming' ? 'default' : 'secondary'}>
                2. Confirm
              </Badge>
              <Badge variant={step === 'success' ? 'default' : 'secondary'}>
                3. Listed
              </Badge>
            </div>

            {/* Input Step */}
            {step === 'input' && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="price" className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Price (ETH)
                  </Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.001"
                    min="0"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0.1"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Set the price in ETH for your NFT
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1" disabled={!price || Number(price) <= 0}>
                    Continue
                  </Button>
                </div>
              </form>
            )}

            {/* Confirming Step */}
            {step === 'confirming' && (
              <div className="space-y-4">
                <div className="text-center">
                  <Loader2 className="w-12 h-12 mx-auto animate-spin text-primary" />
                  <h3 className="text-lg font-semibold mt-4">Listing NFT...</h3>
                  <p className="text-sm text-muted-foreground">
                    Please confirm the transactions in your wallet
                  </p>
                </div>

                <div className="space-y-2 p-4 bg-muted rounded-lg">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Price:</span>
                    <span className="font-semibold">{price} ETH</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Step 1:</span>
                    <span className="text-sm">Approve marketplace</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Step 2:</span>
                    <span className="text-sm">List for sale</span>
                  </div>
                </div>

                {isLoading && (
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">
                      This requires two transactions: approval and listing
                    </p>
                  </div>
                )}

                <Button variant="outline" onClick={handleClose} className="w-full">
                  Cancel
                </Button>
              </div>
            )}

            {/* Success Step */}
            {step === 'success' && result && (
              <div className="space-y-4">
                <div className="text-center">
                  <Check className="w-12 h-12 mx-auto text-green-600" />
                  <h3 className="text-lg font-semibold mt-4 text-green-600">Listed Successfully!</h3>
                  <p className="text-sm text-muted-foreground">
                    Your NFT is now available for purchase on the marketplace
                  </p>
                </div>

                <div className="space-y-2 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Price:</span>
                    <span className="font-semibold">{price} ETH</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Listing ID:</span>
                    <span className="font-mono text-sm">{result.listingId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Transaction:</span>
                    <span className="font-mono text-xs truncate max-w-[120px]">
                      {result.transactionHash}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleClose} className="flex-1">
                    Close
                  </Button>
                  <Button onClick={() => {
                    // Navigate to marketplace
                    window.location.href = '/market'
                  }} className="flex-1">
                    View in Marketplace
                  </Button>
                </div>
              </div>
            )}

            {/* Error Step */}
            {step === 'error' && (
              <div className="space-y-4">
                <div className="text-center">
                  <AlertCircle className="w-12 h-12 mx-auto text-red-600" />
                  <h3 className="text-lg font-semibold mt-4 text-red-600">Listing Failed</h3>
                  <p className="text-sm text-muted-foreground">
                    There was an error listing your NFT. Please try again.
                  </p>
                </div>

                {error && (
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {error.message}
                    </p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleClose} className="flex-1">
                    Cancel
                  </Button>
                  <Button onClick={() => setStep('input')} className="flex-1">
                    Try Again
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}