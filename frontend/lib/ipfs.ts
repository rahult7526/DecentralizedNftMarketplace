import { create } from 'ipfs-http-client'
import { PinataSDK } from 'pinata-sdk'

// IPFS client configuration
const ipfsClient = create({
  url: process.env.NEXT_PUBLIC_IPFS_GATEWAY || 'https://gateway.pinata.cloud/ipfs/',
})

// Pinata SDK for pinning
const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_API_KEY || '',
  pinataGateway: process.env.NEXT_PUBLIC_IPFS_GATEWAY || 'https://gateway.pinata.cloud/ipfs/',
})

export interface IPFSUploadResult {
  hash: string
  url: string
  size: number
}

/**
 * Upload file to IPFS using Pinata
 * @param file File to upload
 * @param metadata Optional metadata
 * @returns IPFS hash and URL
 */
export async function uploadToIPFS(
  file: File,
  metadata?: Record<string, any>
): Promise<IPFSUploadResult> {
  try {
    const formData = new FormData()
    formData.append('file', file)
    
    if (metadata) {
      formData.append('pinataMetadata', JSON.stringify(metadata))
    }

    const response = await pinata.upload.file(formData)
    
    return {
      hash: response.IpfsHash,
      url: `${process.env.NEXT_PUBLIC_IPFS_GATEWAY}${response.IpfsHash}`,
      size: response.PinSize,
    }
  } catch (error) {
    console.error('Error uploading to IPFS:', error)
    throw new Error('Failed to upload file to IPFS')
  }
}

/**
 * Upload JSON metadata to IPFS
 * @param metadata Metadata object
 * @returns IPFS hash and URL
 */
export async function uploadMetadataToIPFS(
  metadata: Record<string, any>
): Promise<IPFSUploadResult> {
  try {
    const response = await pinata.upload.json(metadata)
    
    return {
      hash: response.IpfsHash,
      url: `${process.env.NEXT_PUBLIC_IPFS_GATEWAY}${response.IpfsHash}`,
      size: response.PinSize,
    }
  } catch (error) {
    console.error('Error uploading metadata to IPFS:', error)
    throw new Error('Failed to upload metadata to IPFS')
  }
}

/**
 * Get file from IPFS
 * @param hash IPFS hash
 * @returns File content
 */
export async function getFromIPFS(hash: string): Promise<Uint8Array> {
  try {
    const chunks = []
    for await (const chunk of ipfsClient.cat(hash)) {
      chunks.push(chunk)
    }
    
    const content = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0))
    let offset = 0
    for (const chunk of chunks) {
      content.set(chunk, offset)
      offset += chunk.length
    }
    
    return content
  } catch (error) {
    console.error('Error getting file from IPFS:', error)
    throw new Error('Failed to get file from IPFS')
  }
}

/**
 * Create NFT metadata object
 * @param name NFT name
 * @param description NFT description
 * @param image IPFS URL of the image
 * @param attributes NFT attributes
 * @returns Metadata object
 */
export function createNFTMetadata(
  name: string,
  description: string,
  image: string,
  attributes: Array<{ trait_type: string; value: string | number }> = []
) {
  return {
    name,
    description,
    image,
    attributes,
    external_url: process.env.NEXT_PUBLIC_APP_URL || '',
    background_color: '000000',
    animation_url: '',
    youtube_url: '',
  }
}

