import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { metadata, options } = body

    if (!metadata) {
      return NextResponse.json(
        { error: 'No metadata provided' },
        { status: 400 }
      )
    }

    const pinataApiKey = process.env.NEXT_PUBLIC_PINATA_API_KEY
    const pinataSecretApiKey = process.env.NEXT_PUBLIC_PINATA_SECRET_API_KEY

    if (!pinataApiKey || !pinataSecretApiKey) {
      return NextResponse.json(
        { error: 'Pinata API keys not configured' },
        { status: 500 }
      )
    }

    // Prepare the request body for Pinata
    const pinataBody = {
      pinataContent: metadata,
      pinataMetadata: {
        name: options?.name || `${metadata.name}-metadata`,
        keyvalues: options?.keyvalues || {}
      }
    }

    // Upload JSON to Pinata
    const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'pinata_api_key': pinataApiKey,
        'pinata_secret_api_key': pinataSecretApiKey,
      },
      body: JSON.stringify(pinataBody),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Pinata JSON upload failed:', errorText)
      return NextResponse.json(
        { error: 'Failed to upload JSON to Pinata' },
        { status: 500 }
      )
    }

    const result = await response.json()

    const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`
    const tokenURI = `ipfs://${result.IpfsHash}`

    return NextResponse.json({
      ipfsCid: result.IpfsHash,
      ipfsUrl,
      tokenURI,
      pinSize: result.PinSize,
      timestamp: result.Timestamp,
    })

  } catch (error) {
    console.error('Error uploading JSON:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}