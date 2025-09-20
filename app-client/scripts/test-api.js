#!/usr/bin/env node

/**
 * Test script for marketplace API endpoints
 */

async function testAPI() {
  const baseUrl = 'http://localhost:3000/api/market'
  
  console.log('🧪 Testing Marketplace API Endpoints...\n')
  
  const endpoints = [
    '/listings',
    '/auctions',
    '/stats',
    '/bids?user=0x1234567890123456789012345678901234567890'
  ]
  
  for (const endpoint of endpoints) {
    try {
      console.log(`📋 Testing: ${endpoint}`)
      const response = await fetch(`${baseUrl}${endpoint}`)
      const data = await response.json()
      
      if (response.ok) {
        console.log(`✅ Status: ${response.status}`)
        console.log(`📊 Response:`, JSON.stringify(data, null, 2))
      } else {
        console.log(`❌ Status: ${response.status}`)
        console.log(`🔍 Error:`, data)
      }
    } catch (error) {
      console.log(`💥 Network Error:`, error.message)
    }
    
    console.log('---\n')
  }
  
  console.log('🏁 API test completed!')
}

testAPI().catch(console.error)