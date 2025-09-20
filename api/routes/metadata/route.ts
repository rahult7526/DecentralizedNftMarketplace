import { NextRequest, NextResponse } from 'next/server'
import { PinataSDK } from 'pinata-sdk'

const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_API_KEY || '',
  pinataGateway: process.env.NEXT_PUBLIC_IPFS_GATEWAY || 'https://gateway.pinata.cloud/ipfs/',
})

export async function POST(request: NextRequest) {
  try {
    const metadata = await request.json()
    
    // Validate required fields
    if (!metadata.name || !metadata.description || !metadata.image) {
      return NextResponse.json(
        { error: 'Missing required fields: name, description, image' },
        { status: 400 }
      )
    }

    // Upload metadata to Pinata
    const response = await pinata.upload.json(metadata)
    
    return NextResponse.json({
      hash: response.IpfsHash,
      url: `${process.env.NEXT_PUBLIC_IPFS_GATEWAY}${response.IpfsHash}`,
      size: response.PinSize,
    })
  } catch (error) {
    console.error('Error uploading metadata to IPFS:', error)
    return NextResponse.json(
      { error: 'Failed to upload metadata' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const hash = searchParams.get('hash')
    
    if (!hash) {
      return NextResponse.json(
        { error: 'Hash parameter is required' },
        { status: 400 }
      )
    }

    // Fetch metadata from IPFS
    const response = await fetch(`${process.env.NEXT_PUBLIC_IPFS_GATEWAY}${hash}`)
    
    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch metadata' },
        { status: 404 }
      )
    }

    const metadata = await response.json()
    return NextResponse.json(metadata)
  } catch (error) {
    console.error('Error fetching metadata from IPFS:', error)
    return NextResponse.json(
      { error: 'Failed to fetch metadata' },
      { status: 500 }
    )
  }
}

