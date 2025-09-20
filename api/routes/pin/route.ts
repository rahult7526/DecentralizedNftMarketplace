import { NextRequest, NextResponse } from 'next/server'
import { PinataSDK } from 'pinata-sdk'

const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_API_KEY || '',
  pinataGateway: process.env.NEXT_PUBLIC_IPFS_GATEWAY || 'https://gateway.pinata.cloud/ipfs/',
})

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Upload to Pinata
    const uploadData = new FormData()
    uploadData.append('file', file)
    
    const response = await pinata.upload.file(uploadData)
    
    return NextResponse.json({
      hash: response.IpfsHash,
      url: `${process.env.NEXT_PUBLIC_IPFS_GATEWAY}${response.IpfsHash}`,
      size: response.PinSize,
    })
  } catch (error) {
    console.error('Error uploading to IPFS:', error)
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}

