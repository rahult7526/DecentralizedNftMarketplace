import { useContractWrite, usePrepareContractWrite, useWaitForTransaction, useAccount, useNetwork, useContractRead } from 'wagmi'
import { MARKETPLACE_CONTRACT_ABI, NFT_CONTRACT_ABI, getMarketplaceAddress, getContractAddress } from '../contracts'
import { useState } from 'react'
import { parseEther, formatEther } from 'viem'
import toast from 'react-hot-toast'

export interface UseListNFTProps {
  onSuccess?: (listingId: string, transactionHash: string) => void
  onError?: (error: Error) => void
}

export function useListNFT({ onSuccess, onError }: UseListNFTProps = {}) {
  const { address } = useAccount()
  const { chain } = useNetwork()
  const [isLoading, setIsLoading] = useState(false)
  const [listingParams, setListingParams] = useState<{
    nftContract: string
    tokenId: string
    price: string
  } | null>(null)
  
  const marketplaceAddress = getMarketplaceAddress(chain?.id || 31337)

  // Prepare the contract write for approval
  const { config: approveConfig, error: approveError } = usePrepareContractWrite({
    address: listingParams?.nftContract as `0x${string}`,
    abi: NFT_CONTRACT_ABI,
    functionName: 'approve',
    args: listingParams ? [marketplaceAddress as `0x${string}`, BigInt(listingParams.tokenId)] : undefined,
    enabled: !!listingParams && !!address,
  })

  // Prepare the contract write for listing
  const { config: listConfig, error: listError } = usePrepareContractWrite({
    address: marketplaceAddress as `0x${string}`,
    abi: MARKETPLACE_CONTRACT_ABI,
    functionName: 'listItem',
    args: listingParams ? [
      listingParams.nftContract as `0x${string}`,
      BigInt(listingParams.tokenId),
      parseEther(listingParams.price)
    ] : undefined,
    enabled: !!listingParams && !!address,
  })

  // Approval transaction
  const { 
    data: approveData, 
    error: approveWriteError, 
    isLoading: isApproving, 
    write: approveWrite 
  } = useContractWrite({
    ...approveConfig,
    onSuccess(data) {
      console.log('Approval transaction sent:', data.hash)
      toast.success('Approval transaction sent! Waiting for confirmation...')
    },
    onError(error) {
      console.error('Approval failed:', error)
      setIsLoading(false)
      onError?.(error)
      toast.error('Approval failed: ' + error.message)
    },
  })

  // Listing transaction  
  const { 
    data: listData, 
    error: listWriteError, 
    isLoading: isListing, 
    write: listWrite 
  } = useContractWrite({
    ...listConfig,
    onSuccess(data) {
      console.log('Listing transaction sent:', data.hash)
      toast.success('Listing transaction sent! Waiting for confirmation...')
    },
    onError(error) {
      console.error('Listing failed:', error)
      setIsLoading(false)
      onError?.(error)
      toast.error('Listing failed: ' + error.message)
    },
  })

  // Wait for approval confirmation
  const { isLoading: isWaitingApproval } = useWaitForTransaction({
    hash: approveData?.hash,
    onSuccess() {
      console.log('Approval confirmed, proceeding with listing...')
      toast.success('Approval confirmed! Now listing NFT...')
      // After approval is confirmed, proceed with listing
      setTimeout(() => {
        if (listWrite) {
          listWrite()
        }
      }, 1000)
    },
    onError(error) {
      console.error('Approval confirmation failed:', error)
      setIsLoading(false)
      onError?.(error)
      toast.error('Approval confirmation failed')
    },
  })

  // Wait for listing confirmation
  const { isLoading: isWaitingListing } = useWaitForTransaction({
    hash: listData?.hash,
    onSuccess(receipt) {
      console.log('Listing confirmed:', receipt)
      setIsLoading(false)
      
      // Extract listingId from transaction logs
      const listingId = extractListingIdFromLogs(receipt.logs)
      
      toast.success('NFT listed successfully!')
      onSuccess?.(listingId, receipt.transactionHash)
    },
    onError(error) {
      console.error('Listing confirmation failed:', error)
      setIsLoading(false)
      onError?.(error)
      toast.error('Listing confirmation failed')
    },
  })

  const listNFT = async (nftContract: string, tokenId: string, priceInEth: string) => {
    if (!address) {
      toast.error('Please connect your wallet')
      return
    }

    if (!priceInEth || isNaN(Number(priceInEth)) || Number(priceInEth) <= 0) {
      toast.error('Please enter a valid price')
      return
    }

    setIsLoading(true)
    setListingParams({ nftContract, tokenId, price: priceInEth })
    
    // Start with approval
    setTimeout(() => {
      if (approveWrite) {
        approveWrite()
      } else {
        setIsLoading(false)
        toast.error('Unable to prepare approval transaction')
      }
    }, 100)
  }

  return {
    listNFT,
    isLoading: isLoading || isApproving || isWaitingApproval || isListing || isWaitingListing,
    error: approveError || listError || approveWriteError || listWriteError,
    approvalHash: approveData?.hash,
    listingHash: listData?.hash,
  }
}

export interface UseBuyNFTProps {
  onSuccess?: (transactionHash: string) => void
  onError?: (error: Error) => void
}

export function useBuyNFT({ onSuccess, onError }: UseBuyNFTProps = {}) {
  const { address } = useAccount()
  const { chain } = useNetwork()
  const [isLoading, setIsLoading] = useState(false)
  const [buyParams, setBuyParams] = useState<{
    listingId: string
    price: string
  } | null>(null)
  
  const marketplaceAddress = getMarketplaceAddress(chain?.id || 31337)

  // Prepare the contract write for buying
  const { config, error: prepareError } = usePrepareContractWrite({
    address: marketplaceAddress as `0x${string}`,
    abi: MARKETPLACE_CONTRACT_ABI,
    functionName: 'buyItem',
    args: buyParams ? [BigInt(buyParams.listingId)] : undefined,
    value: buyParams ? parseEther(buyParams.price) : undefined,
    enabled: !!buyParams && !!address,
  })

  // Buy transaction
  const { 
    data, 
    error: writeError, 
    isLoading: isWriteLoading, 
    write 
  } = useContractWrite({
    ...config,
    onSuccess(data) {
      console.log('Buy transaction sent:', data.hash)
      toast.success('Purchase transaction sent! Waiting for confirmation...')
    },
    onError(error) {
      console.error('Purchase failed:', error)
      setIsLoading(false)
      onError?.(error)
      
      if (error.message.includes('rejected')) {
        toast.error('Transaction rejected by user')
      } else if (error.message.includes('insufficient funds')) {
        toast.error('Insufficient funds for purchase')
      } else {
        toast.error('Purchase failed: ' + error.message)
      }
    },
  })

  // Wait for transaction confirmation
  const { isLoading: isWaitingForTransaction } = useWaitForTransaction({
    hash: data?.hash,
    onSuccess(receipt) {
      console.log('Purchase confirmed:', receipt)
      setIsLoading(false)
      
      toast.success('NFT purchased successfully!')
      onSuccess?.(receipt.transactionHash)
    },
    onError(error) {
      console.error('Purchase confirmation failed:', error)
      setIsLoading(false)
      onError?.(error)
      toast.error('Purchase confirmation failed')
    },
  })

  const buyNFT = async (listingId: string, priceInEth: string) => {
    if (!address) {
      toast.error('Please connect your wallet')
      return
    }

    setIsLoading(true)
    setBuyParams({ listingId, price: priceInEth })
    
    setTimeout(() => {
      if (write) {
        write()
      } else {
        setIsLoading(false)
        toast.error('Unable to prepare purchase transaction')
      }
    }, 100)
  }

  return {
    buyNFT,
    isLoading: isLoading || isWriteLoading || isWaitingForTransaction,
    error: prepareError || writeError,
    transactionHash: data?.hash,
  }
}

export function useMarketplaceListings() {
  const { chain } = useNetwork()
  const marketplaceAddress = getMarketplaceAddress(chain?.id || 31337)

  const { data: listings, isLoading, error, refetch } = useContractRead({
    address: marketplaceAddress as `0x${string}`,
    abi: MARKETPLACE_CONTRACT_ABI,
    functionName: 'getActiveListings',
    enabled: !!marketplaceAddress,
    watch: true, // Re-fetch when new blocks are mined
  })

  const formattedListings = listings ? (listings as any[]).map((listing: any) => ({
    listingId: listing.listingId?.toString() || '0',
    nftContract: listing.nftContract || '',
    tokenId: listing.tokenId?.toString() || '0',
    seller: listing.seller || '',
    price: listing.price ? formatEther(listing.price) : '0',
    isActive: listing.isActive || false,
  })) : []

  return {
    listings: formattedListings,
    isLoading,
    error,
    refetch,
  }
}

// Helper function to extract listingId from transaction logs
function extractListingIdFromLogs(logs: any[]): string {
  try {
    // Look for ItemListed event logs
    for (const log of logs) {
      if (log.topics && log.topics.length >= 4) {
        // ItemListed event signature
        const itemListedSignature = '0x...' // This would be the actual event signature
        if (log.topics[0] === itemListedSignature) {
          // ListingId is the first indexed parameter
          const listingIdHex = log.topics[1]
          const listingId = parseInt(listingIdHex, 16).toString()
          return listingId
        }
      }
    }
  } catch (error) {
    console.error('Error extracting listingId:', error)
  }
  
  // Fallback: return a placeholder
  return Date.now().toString()
}