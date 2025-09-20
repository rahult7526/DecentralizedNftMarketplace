'use client'

import { useState } from 'react'
import { useAccount, useContractRead, useContractWrite, usePrepareContractWrite, useWaitForTransaction, useNetwork } from 'wagmi'
import { parseEther, formatEther } from 'viem'
import { MARKETPLACE_CONTRACT_ABI, getMarketplaceAddress, MarketplaceAuction } from '@/lib/contracts'
import toast from 'react-hot-toast'

// Utility function to extract auction ID from transaction logs
function extractAuctionIdFromLogs(logs: any[]): string | null {
  for (const log of logs) {
    try {
      // Look for AuctionCreated event
      if (log.topics?.[0] && log.topics[1]) {
        return log.topics[1] // auctionId is the first indexed parameter
      }
    } catch (error) {
      console.warn('Error parsing log:', error)
    }
  }
  return null
}

export interface UseCreateAuctionProps {
  onSuccess?: (auctionId: string, transactionHash: string) => void
  onError?: (error: Error) => void
}

export function useCreateAuction({ onSuccess, onError }: UseCreateAuctionProps = {}) {
  const { address } = useAccount()
  const { chain } = useNetwork()
  const [isLoading, setIsLoading] = useState(false)
  const [auctionParams, setAuctionParams] = useState<{
    nftContract: string
    tokenId: string
    startingBid: string
    duration: number
  } | null>(null)
  
  const marketplaceAddress = getMarketplaceAddress(chain?.id || 31337)

  // Prepare the contract write for creating auction
  const { config, error: prepareError } = usePrepareContractWrite({
    address: marketplaceAddress as `0x${string}`,
    abi: MARKETPLACE_CONTRACT_ABI,
    functionName: 'createAuction',
    args: auctionParams ? [
      auctionParams.nftContract as `0x${string}`,
      BigInt(auctionParams.tokenId),
      parseEther(auctionParams.startingBid),
      BigInt(auctionParams.duration)
    ] : undefined,
    enabled: !!auctionParams && !!address,
  })

  // Create auction transaction
  const { 
    data, 
    error: writeError, 
    isLoading: isWriteLoading, 
    write 
  } = useContractWrite({
    ...config,
    onSuccess(data) {
      console.log('Create auction transaction sent:', data.hash)
      toast.success('Auction creation transaction sent! Waiting for confirmation...')
    },
    onError(error) {
      console.error('Create auction failed:', error)
      setIsLoading(false)
      onError?.(error)
      
      if (error.message.includes('rejected')) {
        toast.error('Transaction rejected by user')
      } else {
        toast.error('Failed to create auction: ' + error.message)
      }
    },
  })

  // Wait for transaction confirmation
  const { isLoading: isWaitingForTransaction } = useWaitForTransaction({
    hash: data?.hash,
    onSuccess(receipt) {
      console.log('Auction creation confirmed:', receipt)
      setIsLoading(false)
      
      // Extract auction ID from transaction logs
      const auctionId = extractAuctionIdFromLogs(receipt.logs)
      
      toast.success('Auction created successfully!')
      onSuccess?.(auctionId || 'unknown', receipt.transactionHash)
    },
    onError(error) {
      console.error('Auction creation confirmation failed:', error)
      setIsLoading(false)
      onError?.(error)
      toast.error('Auction creation confirmation failed')
    },
  })

  const createAuction = async (
    nftContract: string, 
    tokenId: string, 
    startingBidInEth: string, 
    durationInSeconds: number
  ) => {
    if (!address) {
      toast.error('Please connect your wallet')
      return
    }

    if (!startingBidInEth || isNaN(Number(startingBidInEth)) || Number(startingBidInEth) <= 0) {
      toast.error('Please enter a valid starting bid')
      return
    }

    if (durationInSeconds < 3600 || durationInSeconds > 604800) {
      toast.error('Auction duration must be between 1 hour and 7 days')
      return
    }

    setIsLoading(true)
    setAuctionParams({ 
      nftContract, 
      tokenId, 
      startingBid: startingBidInEth, 
      duration: durationInSeconds 
    })
    
    setTimeout(() => {
      if (write) {
        write()
      } else {
        setIsLoading(false)
        toast.error('Unable to prepare auction creation transaction')
      }
    }, 100)
  }

  return {
    createAuction,
    isLoading: isLoading || isWriteLoading || isWaitingForTransaction,
    error: prepareError || writeError,
    transactionHash: data?.hash,
  }
}

export interface UsePlaceBidProps {
  onSuccess?: (transactionHash: string) => void
  onError?: (error: Error) => void
}

export function usePlaceBid({ onSuccess, onError }: UsePlaceBidProps = {}) {
  const { address } = useAccount()
  const { chain } = useNetwork()
  const [isLoading, setIsLoading] = useState(false)
  const [bidParams, setBidParams] = useState<{
    auctionId: string
    bidAmount: string
  } | null>(null)
  
  const marketplaceAddress = getMarketplaceAddress(chain?.id || 31337)

  // Prepare the contract write for placing bid
  const { config, error: prepareError } = usePrepareContractWrite({
    address: marketplaceAddress as `0x${string}`,
    abi: MARKETPLACE_CONTRACT_ABI,
    functionName: 'placeBid',
    args: bidParams ? [bidParams.auctionId as `0x${string}`] : undefined,
    value: bidParams ? parseEther(bidParams.bidAmount) : undefined,
    enabled: !!bidParams && !!address,
  })

  // Place bid transaction
  const { 
    data, 
    error: writeError, 
    isLoading: isWriteLoading, 
    write 
  } = useContractWrite({
    ...config,
    onSuccess(data) {
      console.log('Place bid transaction sent:', data.hash)
      toast.success('Bid transaction sent! Waiting for confirmation...')
    },
    onError(error) {
      console.error('Place bid failed:', error)
      setIsLoading(false)
      onError?.(error)
      
      if (error.message.includes('rejected')) {
        toast.error('Transaction rejected by user')
      } else if (error.message.includes('BidTooLow')) {
        toast.error('Bid amount too low')
      } else if (error.message.includes('AuctionEnded')) {
        toast.error('Auction has ended')
      } else {
        toast.error('Failed to place bid: ' + error.message)
      }
    },
  })

  // Wait for transaction confirmation
  const { isLoading: isWaitingForTransaction } = useWaitForTransaction({
    hash: data?.hash,
    onSuccess(receipt) {
      console.log('Bid placed confirmed:', receipt)
      setIsLoading(false)
      
      toast.success('Bid placed successfully!')
      onSuccess?.(receipt.transactionHash)
    },
    onError(error) {
      console.error('Bid confirmation failed:', error)
      setIsLoading(false)
      onError?.(error)
      toast.error('Bid confirmation failed')
    },
  })

  const placeBid = async (auctionId: string, bidAmountInEth: string) => {
    if (!address) {
      toast.error('Please connect your wallet')
      return
    }

    if (!bidAmountInEth || isNaN(Number(bidAmountInEth)) || Number(bidAmountInEth) <= 0) {
      toast.error('Please enter a valid bid amount')
      return
    }

    setIsLoading(true)
    setBidParams({ auctionId, bidAmount: bidAmountInEth })
    
    setTimeout(() => {
      if (write) {
        write()
      } else {
        setIsLoading(false)
        toast.error('Unable to prepare bid transaction')
      }
    }, 100)
  }

  return {
    placeBid,
    isLoading: isLoading || isWriteLoading || isWaitingForTransaction,
    error: prepareError || writeError,
    transactionHash: data?.hash,
  }
}

export interface UseEndAuctionProps {
  onSuccess?: (transactionHash: string) => void
  onError?: (error: Error) => void
}

export function useEndAuction({ onSuccess, onError }: UseEndAuctionProps = {}) {
  const { address } = useAccount()
  const { chain } = useNetwork()
  const [isLoading, setIsLoading] = useState(false)
  const [auctionId, setAuctionId] = useState<string | null>(null)
  
  const marketplaceAddress = getMarketplaceAddress(chain?.id || 31337)

  // Prepare the contract write for ending auction
  const { config, error: prepareError } = usePrepareContractWrite({
    address: marketplaceAddress as `0x${string}`,
    abi: MARKETPLACE_CONTRACT_ABI,
    functionName: 'endAuction',
    args: auctionId ? [auctionId as `0x${string}`] : undefined,
    enabled: !!auctionId && !!address,
  })

  // End auction transaction
  const { 
    data, 
    error: writeError, 
    isLoading: isWriteLoading, 
    write 
  } = useContractWrite({
    ...config,
    onSuccess(data) {
      console.log('End auction transaction sent:', data.hash)
      toast.success('End auction transaction sent! Waiting for confirmation...')
    },
    onError(error) {
      console.error('End auction failed:', error)
      setIsLoading(false)
      onError?.(error)
      
      if (error.message.includes('rejected')) {
        toast.error('Transaction rejected by user')
      } else if (error.message.includes('AuctionNotEnded')) {
        toast.error('Auction has not ended yet')
      } else {
        toast.error('Failed to end auction: ' + error.message)
      }
    },
  })

  // Wait for transaction confirmation
  const { isLoading: isWaitingForTransaction } = useWaitForTransaction({
    hash: data?.hash,
    onSuccess(receipt) {
      console.log('End auction confirmed:', receipt)
      setIsLoading(false)
      
      toast.success('Auction ended successfully!')
      onSuccess?.(receipt.transactionHash)
    },
    onError(error) {
      console.error('End auction confirmation failed:', error)
      setIsLoading(false)
      onError?.(error)
      toast.error('End auction confirmation failed')
    },
  })

  const endAuction = async (auctionIdToEnd: string) => {
    if (!address) {
      toast.error('Please connect your wallet')
      return
    }

    setIsLoading(true)
    setAuctionId(auctionIdToEnd)
    
    setTimeout(() => {
      if (write) {
        write()
      } else {
        setIsLoading(false)
        toast.error('Unable to prepare end auction transaction')
      }
    }, 100)
  }

  return {
    endAuction,
    isLoading: isLoading || isWriteLoading || isWaitingForTransaction,
    error: prepareError || writeError,
    transactionHash: data?.hash,
  }
}

export function useMarketplaceAuctions() {
  const { chain } = useNetwork()
  const marketplaceAddress = getMarketplaceAddress(chain?.id || 31337)

  const { data: auctionIds, isLoading, error, refetch } = useContractRead({
    address: marketplaceAddress as `0x${string}`,
    abi: MARKETPLACE_CONTRACT_ABI,
    functionName: 'getActiveAuctions',
    enabled: !!marketplaceAddress,
    watch: true, // Re-fetch when new blocks are mined
  })

  const formattedAuctions = auctionIds ? (auctionIds as string[]).map((auctionId: string) => ({
    auctionId,
    // Note: Individual auction details would need to be fetched separately
    // using getAuction(auctionId) for each auction
  })) : []

  return {
    auctionIds: formattedAuctions,
    isLoading,
    error,
    refetch,
  }
}

export function useAuctionDetails(auctionId: string | null) {
  const { chain } = useNetwork()
  const marketplaceAddress = getMarketplaceAddress(chain?.id || 31337)

  const { data: auctionData, isLoading, error, refetch } = useContractRead({
    address: marketplaceAddress as `0x${string}`,
    abi: MARKETPLACE_CONTRACT_ABI,
    functionName: 'getAuction',
    args: auctionId ? [auctionId as `0x${string}`] : undefined,
    enabled: !!auctionId && !!marketplaceAddress,
    watch: true,
  })

  const formattedAuction: MarketplaceAuction | null = auctionData ? {
    auctionId: (auctionData as any).id || auctionId || '',
    nftContract: (auctionData as any).nftContract || '',
    tokenId: (auctionData as any).tokenId?.toString() || '0',
    seller: (auctionData as any).seller || '',
    startingBid: (auctionData as any).startingBid ? formatEther((auctionData as any).startingBid) : '0',
    highestBid: (auctionData as any).highestBid ? formatEther((auctionData as any).highestBid) : '0',
    highestBidder: (auctionData as any).highestBidder || '',
    endTime: Number((auctionData as any).endTime) || 0,
    isActive: Boolean((auctionData as any).isActive),
    isFinalized: Boolean((auctionData as any).isFinalized),
    createdAt: Number((auctionData as any).createdAt) || 0,
  } : null

  return {
    auction: formattedAuction,
    isLoading,
    error,
    refetch,
  }
}