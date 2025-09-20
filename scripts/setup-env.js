#!/usr/bin/env node

/**
 * Environment Setup Helper
 * Helps set up environment variables for deployment
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setupContractsEnv() {
  console.log('\n🔧 Setting up contracts environment (.env)');
  console.log('='.repeat(50));
  
  const envPath = path.join(__dirname, '../contracts/.env');
  
  console.log('\nYou\'ll need:');
  console.log('1. Private key (without 0x prefix) from your deployment wallet');
  console.log('2. Alchemy API URL for Sepolia');
  console.log('3. Etherscan API key (optional, for contract verification)');
  console.log('');
  
  const privateKey = await question('Enter your private key (without 0x): ');
  const alchemyUrl = await question('Enter your Alchemy URL: ');
  const etherscanKey = await question('Enter your Etherscan API key (optional): ');
  
  const envContent = `# Smart Contract Deployment Environment
# DO NOT COMMIT THIS FILE TO VERSION CONTROL

# Deployment wallet private key (without 0x prefix)
PRIVATE_KEY="${privateKey}"

# Alchemy RPC URL for Sepolia
ALCHEMY_URL="${alchemyUrl}"

# Etherscan API key for contract verification (optional)
ETHERSCAN_API_KEY="${etherscanKey}"

# Optional: Test NFT minting during deployment
DEPLOY_TEST_NFT="false"
`;
  
  fs.writeFileSync(envPath, envContent);
  console.log(`✅ Created ${envPath}`);
}

async function setupFrontendEnv() {
  console.log('\n🎨 Setting up frontend environment (.env.production)');
  console.log('='.repeat(55));
  
  const envPath = path.join(__dirname, '../app-client/.env.production');
  
  console.log('\nContract addresses will be filled after deployment.');
  console.log('You\'ll need:');
  console.log('1. Alchemy API key');
  console.log('2. Pinata API keys');
  console.log('3. Supabase project details');
  console.log('');
  
  const alchemyKey = await question('Enter your Alchemy API key: ');
  const pinataKey = await question('Enter your Pinata API key: ');
  const pinataSecret = await question('Enter your Pinata secret key: ');
  const supabaseUrl = await question('Enter your Supabase URL: ');
  const supabaseAnonKey = await question('Enter your Supabase anon key: ');
  const supabaseServiceKey = await question('Enter your Supabase service role key: ');
  
  const envContent = `# Frontend Production Environment
# These values will be used in production deployment

# Blockchain Configuration (filled after contract deployment)
NEXT_PUBLIC_CHAIN_ID="11155111"
NEXT_PUBLIC_NETWORK_NAME="sepolia"
NEXT_PUBLIC_NFT_CONTRACT_ADDRESS="CONTRACT_ADDRESS_PLACEHOLDER"
NEXT_PUBLIC_MARKETPLACE_CONTRACT_ADDRESS="CONTRACT_ADDRESS_PLACEHOLDER"

# Alchemy API Configuration
NEXT_PUBLIC_ALCHEMY_API_KEY="${alchemyKey}"

# Pinata IPFS Configuration
NEXT_PUBLIC_PINATA_API_KEY="${pinataKey}"
NEXT_PUBLIC_PINATA_SECRET_API_KEY="${pinataSecret}"
NEXT_PUBLIC_PINATA_GATEWAY="https://gateway.pinata.cloud/ipfs/"

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL="${supabaseUrl}"
NEXT_PUBLIC_SUPABASE_ANON_KEY="${supabaseAnonKey}"
SUPABASE_SERVICE_ROLE_KEY="${supabaseServiceKey}"
`;
  
  fs.writeFileSync(envPath, envContent);
  console.log(`✅ Created ${envPath}`);
}

async function main() {
  console.log('🚀 DeNft Marketplace Environment Setup');
  console.log('======================================');
  console.log('');
  console.log('This script will help you set up environment variables for deployment.');
  console.log('');
  
  const setupType = await question('What would you like to set up? (contracts/frontend/both): ');
  
  switch (setupType.toLowerCase()) {
    case 'contracts':
      await setupContractsEnv();
      break;
    case 'frontend':
      await setupFrontendEnv();
      break;
    case 'both':
    default:
      await setupContractsEnv();
      await setupFrontendEnv();
      break;
  }
  
  console.log('\n🎉 Environment setup complete!');
  console.log('');
  console.log('Next steps:');
  console.log('1. Review the created .env files');
  console.log('2. Deploy contracts with: pnpm deploy:contracts:sepolia');
  console.log('3. Update frontend .env with contract addresses');
  console.log('4. Deploy frontend with: pnpm vercel:deploy');
  console.log('');
  console.log('⚠️  Remember to keep your private keys and API keys secure!');
  
  rl.close();
}

main().catch(console.error);