# Pinata API Usage Examples

This document provides comprehensive examples for using the Pinata upload API endpoints.

## Environment Setup

First, ensure your environment variables are configured:

```bash
# .env.local
PINATA_API_KEY=your_pinata_api_key_here
PINATA_SECRET_API_KEY=your_pinata_secret_key_here
NEXT_PUBLIC_PINATA_GATEWAY=https://gateway.pinata.cloud/ipfs/
```

## API Endpoints

### 1. File Upload - `/api/pinFile`

Uploads files (images, documents, etc.) to Pinata IPFS.

#### cURL Examples

**Upload a file:**
```bash
curl -X POST http://localhost:3000/api/pinFile \
  -F "file=@/path/to/your/image.png" \
  -F "metadata={\"name\":\"my-image\",\"keyvalues\":{\"type\":\"nft-image\"}}"
```

**Upload base64 data:**
```bash
curl -X POST http://localhost:3000/api/pinFile \
  -F "base64=iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==" \
  -F "mimeType=image/png" \
  -F "filename=test.png" \
  -F "metadata={\"name\":\"base64-image\"}"
```

#### JavaScript/Fetch Examples

**Upload file from input:**
```javascript
async function uploadFile(file) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('metadata', JSON.stringify({
    name: 'nft-image',
    keyvalues: {
      type: 'nft-image',
      timestamp: new Date().toISOString(),
    },
  }));

  const response = await fetch('/api/pinFile', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Upload failed');
  }

  return response.json();
}

// Usage
const fileInput = document.getElementById('fileInput');
fileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (file) {
    try {
      const result = await uploadFile(file);
      console.log('Upload successful:', result);
      // result.ipfsCid, result.ipfsUrl
    } catch (error) {
      console.error('Upload failed:', error);
    }
  }
});
```

**Upload base64 data:**
```javascript
async function uploadBase64(base64Data, filename, mimeType) {
  const formData = new FormData();
  formData.append('base64', base64Data);
  formData.append('mimeType', mimeType);
  formData.append('filename', filename);
  formData.append('metadata', JSON.stringify({
    name: filename,
    keyvalues: { type: 'base64-upload' },
  }));

  const response = await fetch('/api/pinFile', {
    method: 'POST',
    body: formData,
  });

  return response.json();
}

// Usage
const base64Data = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
const result = await uploadBase64(base64Data, 'test.png', 'image/png');
```

#### Response Format

```json
{
  "success": true,
  "ipfsCid": "QmYourHashHere",
  "ipfsUrl": "https://gateway.pinata.cloud/ipfs/QmYourHashHere",
  "pinSize": 12345,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 2. JSON Metadata Upload - `/api/pinJSON`

Uploads NFT metadata JSON to Pinata IPFS.

#### cURL Examples

**Upload NFT metadata:**
```bash
curl -X POST http://localhost:3000/api/pinJSON \
  -H "Content-Type: application/json" \
  -d '{
    "metadata": {
      "name": "My Awesome NFT",
      "description": "A unique digital artwork",
      "image": "ipfs://QmImageHashHere",
      "attributes": [
        {"trait_type": "Color", "value": "Blue"},
        {"trait_type": "Rarity", "value": "Rare"}
      ],
      "external_url": "https://mywebsite.com",
      "background_color": "000000"
    },
    "options": {
      "name": "my-nft-metadata",
      "keyvalues": {
        "collection": "my-collection",
        "version": "1.0"
      }
    }
  }'
```

#### JavaScript/Fetch Examples

**Upload NFT metadata:**
```javascript
async function uploadNFTMetadata(metadata) {
  const response = await fetch('/api/pinJSON', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      metadata,
      options: {
        name: 'nft-metadata',
        keyvalues: {
          type: 'nft-metadata',
          timestamp: new Date().toISOString(),
        },
      },
    }),
  });

  if (!response.ok) {
    throw new Error('Metadata upload failed');
  }

  return response.json();
}

// Usage
const metadata = {
  name: 'Cool NFT #1',
  description: 'A unique digital collectible',
  image: 'ipfs://QmImageHashHere',
  attributes: [
    { trait_type: 'Color', value: 'Red' },
    { trait_type: 'Power', value: 85 },
    { trait_type: 'Rarity', value: 'Epic' },
  ],
  external_url: 'https://mywebsite.com/nft/1',
  background_color: 'FF0000',
};

const result = await uploadNFTMetadata(metadata);
console.log('Token URI:', result.tokenURI);
```

**Complete NFT creation flow:**
```javascript
async function createNFT(imageFile, metadata) {
  try {
    // Step 1: Upload image
    const imageFormData = new FormData();
    imageFormData.append('file', imageFile);
    
    const imageResponse = await fetch('/api/pinFile', {
      method: 'POST',
      body: imageFormData,
    });
    const imageResult = await imageResponse.json();
    
    if (!imageResult.success) {
      throw new Error('Image upload failed');
    }

    // Step 2: Upload metadata with image reference
    const nftMetadata = {
      ...metadata,
      image: `ipfs://${imageResult.ipfsCid}`,
    };

    const metadataResponse = await fetch('/api/pinJSON', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ metadata: nftMetadata }),
    });
    const metadataResult = await metadataResponse.json();
    
    if (!metadataResult.success) {
      throw new Error('Metadata upload failed');
    }

    return {
      imageCid: imageResult.ipfsCid,
      imageUrl: imageResult.ipfsUrl,
      metadataCid: metadataResult.ipfsCid,
      tokenURI: metadataResult.tokenURI,
    };
  } catch (error) {
    console.error('NFT creation failed:', error);
    throw error;
  }
}

// Usage
const fileInput = document.getElementById('imageInput');
const nameInput = document.getElementById('nameInput');
const descriptionInput = document.getElementById('descriptionInput');

document.getElementById('createNFT').addEventListener('click', async () => {
  const imageFile = fileInput.files[0];
  const metadata = {
    name: nameInput.value,
    description: descriptionInput.value,
    attributes: [
      { trait_type: 'Created', value: new Date().toISOString() },
    ],
  };

  try {
    const result = await createNFT(imageFile, metadata);
    console.log('NFT created successfully:', result);
    // Use result.tokenURI for minting
  } catch (error) {
    console.error('Failed to create NFT:', error);
  }
});
```

#### Response Format

```json
{
  "success": true,
  "ipfsCid": "QmMetadataHashHere",
  "ipfsUrl": "https://gateway.pinata.cloud/ipfs/QmMetadataHashHere",
  "tokenURI": "ipfs://QmMetadataHashHere",
  "pinSize": 1234,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Using the Pinata Library

The `lib/pinata.ts` provides convenient utilities for client-side usage:

```javascript
import { uploadFileToAPI, uploadJsonToAPI, createPinataClient } from '@/lib/pinata';

// Client-side API calls
const fileResult = await uploadFileToAPI(file, { name: 'my-file' });
const jsonResult = await uploadJsonToAPI(metadata, { name: 'my-metadata' });

// Server-side direct Pinata usage
const pinata = createPinataClient();
const result = await pinata.uploadFile({ file, metadata });
```

## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Error message",
  "message": "Detailed error description"
}
```

Common error scenarios:
- Missing environment variables (500)
- Invalid file format (400)
- Missing required fields (400)
- Pinata API errors (500)
- Network errors (500)

## Testing

Run the test script to verify API functionality:

```bash
# Install dependencies
pnpm install

# Start the development server
pnpm dev:client

# In another terminal, run tests
node app-client/scripts/test-pinata-api.js
```

## Integration with Smart Contracts

Use the returned `tokenURI` for minting NFTs:

```javascript
// After uploading metadata
const { tokenURI } = await uploadJsonToAPI(metadata);

// Use with your smart contract
const tx = await nftContract.mint(
  userAddress,
  tokenURI,
  royaltyRecipient,
  royaltyPercentage
);
```

## Best Practices

1. **Always validate files** before uploading
2. **Use meaningful metadata** for better organization
3. **Handle errors gracefully** in your UI
4. **Show upload progress** for better UX
5. **Cache results** to avoid re-uploading
6. **Use appropriate file formats** (PNG, JPG, MP4, etc.)
7. **Keep metadata under 1MB** for optimal performance
