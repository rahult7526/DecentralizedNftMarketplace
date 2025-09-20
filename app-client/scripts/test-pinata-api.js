#!/usr/bin/env node

/**
 * Test script for Pinata API endpoints
 * Run with: node scripts/test-pinata-api.js
 */

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

// Test data
const testImagePath = path.join(__dirname, '../public/test-image.png');
const testMetadata = {
  name: 'Test NFT',
  description: 'A test NFT for API validation',
  image: 'ipfs://QmTestImageHash',
  attributes: [
    { trait_type: 'Color', value: 'Blue' },
    { trait_type: 'Rarity', value: 'Common' },
  ],
  external_url: 'https://example.com',
  background_color: '000000',
};

async function createTestImage() {
  // Create a simple test image if it doesn't exist
  if (!fs.existsSync(testImagePath)) {
    const dir = path.dirname(testImagePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Create a minimal PNG file (1x1 pixel)
    const pngData = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
      0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1 dimensions
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, // bit depth, color type, etc.
      0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41, // IDAT chunk
      0x54, 0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00, // compressed data
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, // end of data
      0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, // IEND chunk
      0xAE, 0x42, 0x60, 0x82
    ]);
    
    fs.writeFileSync(testImagePath, pngData);
    console.log('✅ Created test image');
  }
}

async function testFileUpload() {
  console.log('\n🧪 Testing file upload...');
  
  try {
    await createTestImage();
    
    const formData = new FormData();
    formData.append('file', fs.createReadStream(testImagePath));
    formData.append('metadata', JSON.stringify({
      name: 'test-image',
      keyvalues: {
        type: 'test',
        timestamp: new Date().toISOString(),
      },
    }));

    const response = await fetch(`${API_BASE_URL}/api/pinFile`, {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ File upload successful');
      console.log(`   IPFS CID: ${result.ipfsCid}`);
      console.log(`   IPFS URL: ${result.ipfsUrl}`);
      console.log(`   Pin Size: ${result.pinSize} bytes`);
      return result.ipfsCid;
    } else {
      console.log('❌ File upload failed:', result.error);
      return null;
    }
  } catch (error) {
    console.log('❌ File upload error:', error.message);
    return null;
  }
}

async function testBase64Upload() {
  console.log('\n🧪 Testing base64 upload...');
  
  try {
    await createTestImage();
    const imageBuffer = fs.readFileSync(testImagePath);
    const base64Data = imageBuffer.toString('base64');

    const formData = new FormData();
    formData.append('base64', base64Data);
    formData.append('mimeType', 'image/png');
    formData.append('filename', 'test-base64.png');
    formData.append('metadata', JSON.stringify({
      name: 'test-base64-image',
      keyvalues: {
        type: 'base64-test',
        timestamp: new Date().toISOString(),
      },
    }));

    const response = await fetch(`${API_BASE_URL}/api/pinFile`, {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ Base64 upload successful');
      console.log(`   IPFS CID: ${result.ipfsCid}`);
      console.log(`   IPFS URL: ${result.ipfsUrl}`);
      return result.ipfsCid;
    } else {
      console.log('❌ Base64 upload failed:', result.error);
      return null;
    }
  } catch (error) {
    console.log('❌ Base64 upload error:', error.message);
    return null;
  }
}

async function testJsonUpload(imageCid) {
  console.log('\n🧪 Testing JSON metadata upload...');
  
  try {
    const metadata = {
      ...testMetadata,
      image: `ipfs://${imageCid}`,
    };

    const response = await fetch(`${API_BASE_URL}/api/pinJSON`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        metadata,
        options: {
          name: 'test-nft-metadata',
          keyvalues: {
            type: 'nft-metadata',
            timestamp: new Date().toISOString(),
          },
        },
      }),
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ JSON upload successful');
      console.log(`   IPFS CID: ${result.ipfsCid}`);
      console.log(`   IPFS URL: ${result.ipfsUrl}`);
      console.log(`   Token URI: ${result.tokenURI}`);
      return result;
    } else {
      console.log('❌ JSON upload failed:', result.error);
      return null;
    }
  } catch (error) {
    console.log('❌ JSON upload error:', error.message);
    return null;
  }
}

async function testErrorHandling() {
  console.log('\n🧪 Testing error handling...');
  
  try {
    // Test missing file
    const response1 = await fetch(`${API_BASE_URL}/api/pinFile`, {
      method: 'POST',
      body: new FormData(),
    });
    
    const result1 = await response1.json();
    console.log('✅ Missing file error handled:', result1.error);

    // Test missing metadata
    const response2 = await fetch(`${API_BASE_URL}/api/pinJSON`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    
    const result2 = await response2.json();
    console.log('✅ Missing metadata error handled:', result2.error);

  } catch (error) {
    console.log('❌ Error handling test failed:', error.message);
  }
}

async function runTests() {
  console.log('🚀 Starting Pinata API tests...');
  console.log(`   API Base URL: ${API_BASE_URL}`);
  
  // Check if server is running
  try {
    const healthCheck = await fetch(`${API_BASE_URL}/api/pinFile`, { method: 'OPTIONS' });
    if (!healthCheck.ok) {
      throw new Error('Server not responding');
    }
  } catch (error) {
    console.log('❌ Server not running. Please start the Next.js server first:');
    console.log('   pnpm dev:client');
    process.exit(1);
  }

  // Run tests
  const imageCid = await testFileUpload();
  await testBase64Upload();
  
  if (imageCid) {
    await testJsonUpload(imageCid);
  }
  
  await testErrorHandling();

  console.log('\n🎉 All tests completed!');
  
  // Cleanup
  if (fs.existsSync(testImagePath)) {
    fs.unlinkSync(testImagePath);
    console.log('🧹 Cleaned up test files');
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  testFileUpload,
  testBase64Upload,
  testJsonUpload,
  testErrorHandling,
  runTests,
};
