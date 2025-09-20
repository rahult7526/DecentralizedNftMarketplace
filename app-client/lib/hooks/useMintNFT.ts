import { useContractWrite, usePrepareContractWrite, useWaitForTransaction, useAccount, useNetwork } from 'wagmi'
import { NFT_CONTRACT_ABI, getContractAddress } from '../contracts'
import { useState } from 'react'
import toast from 'react-hot-toast'

export interface UseMintNFTProps {
  onSuccess?: (tokenId: string, transactionHash: string) => void
  onError?: (error: Error) => void
}

export function useMintNFT({ onSuccess, onError }: UseMintNFTProps = {}) {
  const { address } = useAccount()
  const { chain } = useNetwork()
  const [tokenURI, setTokenURI] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  
  const contractAddress = getContractAddress(chain?.id || 31337)

  // Prepare the contract write
  const { config, error: prepareError } = usePrepareContractWrite({
    address: contractAddress as `0x${string}`,
    abi: NFT_CONTRACT_ABI,
    functionName: 'mintTo',
    args: address && tokenURI ? [address, tokenURI] : undefined,
    enabled: !!address && !!tokenURI,
  })

  // Contract write hook
  const { 
    data, 
    error: writeError, 
    isLoading: isWriteLoading, 
    write 
  } = useContractWrite({
    ...config,
    onSuccess(data) {
      console.log('Transaction sent:', data.hash)
      toast.success('Transaction sent! Waiting for confirmation...')
    },
    onError(error) {
      console.error('Transaction failed:', error)
      setIsLoading(false)
      onError?.(error)
      
      // Handle specific error types
      if (error.message.includes('rejected')) {
        toast.error('Transaction rejected by user')
      } else if (error.message.includes('insufficient funds')) {
        toast.error('Insufficient funds for transaction')
      } else {
        toast.error('Transaction failed: ' + error.message)
      }
    },
  })

  // Wait for transaction confirmation
  const { 
    isLoading: isWaitingForTransaction, 
    isSuccess 
  } = useWaitForTransaction({
    hash: data?.hash,
    onSuccess(receipt) {
      console.log('Transaction confirmed:', receipt)
      setIsLoading(false)
      
      // Extract tokenId from transaction logs
      const tokenId = extractTokenIdFromLogs(receipt.logs)
      
      toast.success('NFT minted successfully!')
      onSuccess?.(tokenId, receipt.transactionHash)
    },
    onError(error) {
      console.error('Transaction confirmation failed:', error)
      setIsLoading(false)
      onError?.(error)
      toast.error('Transaction confirmation failed')
    },
  })

  const mintNFT = async (metadataTokenURI: string) => {
    if (!address) {
      toast.error('Please connect your wallet')
      return
    }

    if (!metadataTokenURI) {
      toast.error('Token URI is required')
      return
    }

    setIsLoading(true)
    setTokenURI(metadataTokenURI)
    
    // Wait a bit for the prepare hook to update
    setTimeout(() => {
      if (write) {
        write()
      } else {
        setIsLoading(false)
        toast.error('Unable to prepare transaction')
      }
    }, 100)
  }

  return {
    mintNFT,
    isLoading: isLoading || isWriteLoading || isWaitingForTransaction,
    isSuccess,
    error: prepareError || writeError,
    transactionHash: data?.hash,
  }
}

// Helper function to extract tokenId from transaction logs
function extractTokenIdFromLogs(logs: any[]): string {
  try {
    // Look for Transfer event logs
    for (const log of logs) {
      if (log.topics && log.topics.length >= 4) {
        // Transfer event signature: Transfer(address,address,uint256)
        const transferSignature = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'
        if (log.topics[0] === transferSignature) {
          // TokenId is the 4th topic (index 3)
          const tokenIdHex = log.topics[3]
          const tokenId = parseInt(tokenIdHex, 16).toString()
          return tokenId
        }
      }
    }
  } catch (error) {
    console.error('Error extracting tokenId:', error)
  }
  
  // Fallback: return a placeholder
  return Date.now().toString()
}