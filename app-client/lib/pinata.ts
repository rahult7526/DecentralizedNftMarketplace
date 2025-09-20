// Types
export interface PinataUploadResult {
  ipfsCid: string
  ipfsUrl: string
  pinSize: number
  timestamp: string
  tokenURI?: string
}

export interface PinataMetadata {
  name: string
  description: string
  image: string
  attributes?: Array<{
    trait_type: string
    value: string | number
  }>
  external_url?: string
  background_color?: string
  animation_url?: string
  youtube_url?: string
}

// Client-side utility for API calls
export async function uploadFileToAPI(
  file: File, 
  metadata?: { name?: string; keyvalues?: Record<string, string> }
): Promise<PinataUploadResult> {
  const formData = new FormData()
  formData.append('file', file)
  
  if (metadata) {
    formData.append('metadata', JSON.stringify(metadata))
  }

  const response = await fetch('/api/pinFile', {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to upload file' }))
    throw new Error(error.message || 'Failed to upload file')
  }

  return response.json()
}

export async function uploadJsonToAPI(
  metadata: PinataMetadata, 
  options?: { name?: string; keyvalues?: Record<string, string> }
): Promise<PinataUploadResult> {
  const response = await fetch('/api/pinJSON', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      metadata,
      options,
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to upload JSON' }))
    throw new Error(error.message || 'Failed to upload JSON')
  }

  const result = await response.json()
  return {
    ...result,
    tokenURI: result.ipfsUrl || `https://gateway.pinata.cloud/ipfs/${result.ipfsCid}`,
  }
}

// Utility functions for file handling
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => {
      const result = reader.result as string
      // Remove data:image/jpeg;base64, prefix
      const base64 = result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = error => reject(error)
  })
}

export function base64ToFile(base64: string, filename: string, mimeType: string): File {
  const byteCharacters = atob(base64)
  const byteNumbers = new Array(byteCharacters.length)
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i)
  }
  const byteArray = new Uint8Array(byteNumbers)
  return new File([byteArray], filename, { type: mimeType })
}

// Create NFT metadata helper
export function createNFTMetadata(
  name: string,
  description: string,
  imageCid: string,
  attributes: Array<{ trait_type: string; value: string | number }> = [],
  externalUrl?: string
): PinataMetadata {
  return {
    name,
    description,
    image: `ipfs://${imageCid}`,
    attributes,
    external_url: externalUrl || process.env.NEXT_PUBLIC_APP_URL || '',
    background_color: '000000',
  }
}
