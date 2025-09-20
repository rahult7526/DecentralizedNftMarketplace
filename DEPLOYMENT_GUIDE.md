# Production Deployment Guide

This comprehensive guide walks you through deploying the DeNft Marketplace to production, including smart contracts on Sepolia testnet and frontend on Vercel.

## 📋 Prerequisites

Before starting deployment, ensure you have:

### Required Accounts & Services
- ✅ **Ethereum Wallet** with Sepolia ETH (minimum 0.05 ETH for deployment)
- ✅ **Alchemy Account** - [Get API key](https://www.alchemy.com/)
- ✅ **Pinata Account** - [Get API keys](https://www.pinata.cloud/)
- ✅ **Supabase Account** - [Create project](https://supabase.com/)
- ✅ **Vercel Account** - [Sign up](https://vercel.com/)
- ✅ **Etherscan Account** - [Get API key](https://etherscan.io/apis) (optional, for contract verification)

### Development Environment
- ✅ **Node.js 18+**
- ✅ **Git**
- ✅ **Vercel CLI**: `npm install -g vercel`

### Wallet Setup
- ✅ **MetaMask** or similar wallet
- ✅ **Sepolia ETH** - Get from [Sepolia Faucet](https://faucets.chain.link/sepolia)
- ✅ **Private Key** (for deployment only - use a separate wallet)

## 🚀 Step-by-Step Deployment

### Phase 1: Environment Setup

#### 1.1 Clone and Install Dependencies
```bash
# Clone your repository
git clone https://github.com/your-username/denft-marketplace.git
cd denft-marketplace

# Install dependencies
npm install
cd app-client && npm install
cd ../contracts && npm install
```

#### 1.2 Set Up Environment Variables

**For Smart Contract Deployment** (`contracts/.env`):
```bash
# Create contracts/.env file
cd contracts
cp .env.example .env  # If exists, or create new file

# Add your values
echo "PRIVATE_KEY=your_wallet_private_key_without_0x" >> .env
echo "ALCHEMY_URL=https://eth-sepolia.g.alchemy.com/v2/your_api_key" >> .env
echo "ETHERSCAN_API_KEY=your_etherscan_api_key" >> .env
```

**For Frontend Deployment** (`app-client/.env.production`):
```bash
# Create frontend environment file
cd ../app-client
cp .env.production.example .env.production

# Edit .env.production with your values (will be filled after contract deployment)
```

### Phase 2: Smart Contract Deployment

#### 2.1 Deploy Contracts to Sepolia

```bash
# Navigate to contracts directory
cd contracts

# Deploy contracts
npm run deploy:sepolia
# or manually:
# npx hardhat run scripts/deploy-sepolia.ts --network sepolia
```

**Expected Output:**
```
🚀 Starting production deployment to Sepolia...
✅ Environment validation passed
📡 Network: sepolia (Chain ID: 11155111)
👤 Deployer: 0x1234...
💰 Deployer balance: 0.1 ETH

📦 Deploying DeNftToken...
✅ DeNftToken deployed successfully!
   Address: 0xABC123...

🏪 Deploying NFTMarketplace...
✅ NFTMarketplace deployed successfully!
   Address: 0xDEF456...

🔧 ENVIRONMENT VARIABLES FOR FRONTEND DEPLOYMENT
NEXT_PUBLIC_NFT_CONTRACT_ADDRESS="0xABC123..."
NEXT_PUBLIC_MARKETPLACE_CONTRACT_ADDRESS="0xDEF456..."
NEXT_PUBLIC_CHAIN_ID="11155111"
```

#### 2.2 Copy Contract Addresses

**IMPORTANT**: Copy the contract addresses from the deployment output and update your frontend environment file:

```bash
# Update app-client/.env.production
NEXT_PUBLIC_NFT_CONTRACT_ADDRESS="0xABC123..."  # Your actual address
NEXT_PUBLIC_MARKETPLACE_CONTRACT_ADDRESS="0xDEF456..."  # Your actual address
NEXT_PUBLIC_CHAIN_ID="11155111"
NEXT_PUBLIC_NETWORK_NAME="sepolia"
```

#### 2.3 Update Contract Configuration

Update `app-client/lib/contracts.ts`:
```typescript
// Replace with your deployed contract addresses
export const NFT_CONTRACT_ADDRESS = "0xABC123..." as const;
export const MARKETPLACE_CONTRACT_ADDRESS = "0xDEF456..." as const;
```

### Phase 3: Pinata IPFS Setup

#### 3.1 Create Pinata API Keys

1. Go to [Pinata](https://www.pinata.cloud/)
2. Sign up/login
3. Navigate to **API Keys** section
4. Create new API key with permissions:
   - ✅ `pinFileToIPFS`
   - ✅ `pinJSONToIPFS`
   - ✅ `unpin`

#### 3.2 Pin Initial Assets (Optional)

Create some initial marketplace assets:

```bash
# Navigate to app-client
cd app-client

# Pin marketplace logo/assets to IPFS
node scripts/pin-assets.js  # If you create this script
```

**Manual Pinata Upload:**
1. Upload your marketplace logo, default NFT images
2. Get IPFS hashes for use in your frontend
3. Update any hardcoded IPFS links in your code

### Phase 4: Supabase Database Setup

#### 4.1 Create Supabase Project

1. Go to [Supabase](https://supabase.com/)
2. Create new project
3. Wait for project initialization
4. Note your project URL and API keys

#### 4.2 Set Up Database Schema

1. Go to **SQL Editor** in Supabase dashboard
2. Copy the schema from `INDEXER_SETUP.md`
3. Execute the SQL to create tables

#### 4.3 Configure Environment Variables

Add Supabase credentials to `.env.production`:
```bash
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your_anon_key"
SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"
```

### Phase 5: Frontend Deployment to Vercel

#### 5.1 Complete Environment Configuration

Your `app-client/.env.production` should now include:

```env
# Blockchain Configuration
NEXT_PUBLIC_CHAIN_ID="11155111"
NEXT_PUBLIC_NETWORK_NAME="sepolia"
NEXT_PUBLIC_NFT_CONTRACT_ADDRESS="0x..."
NEXT_PUBLIC_MARKETPLACE_CONTRACT_ADDRESS="0x..."

# Alchemy
NEXT_PUBLIC_ALCHEMY_API_KEY="your_alchemy_api_key"

# Pinata
NEXT_PUBLIC_PINATA_API_KEY="your_pinata_api_key"
NEXT_PUBLIC_PINATA_SECRET_API_KEY="your_pinata_secret_key"
NEXT_PUBLIC_PINATA_GATEWAY="https://gateway.pinata.cloud/ipfs/"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your_anon_key"
SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"
```

#### 5.2 Deploy to Vercel

**Option A: Using the Deployment Script**
```bash
# Navigate to app-client
cd app-client

# Deploy to preview first
npm run vercel:preview

# Deploy to production
npm run vercel:deploy
```

**Option B: Manual Vercel CLI**
```bash
# Login to Vercel
vercel login

# Deploy preview
vercel

# Deploy to production
vercel --prod
```

**Option C: Vercel Dashboard**
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Import your repository
3. Configure environment variables in Vercel settings
4. Deploy

#### 5.3 Configure Vercel Environment Variables

In Vercel Dashboard → Project → Settings → Environment Variables, add:

| Name | Value | Environment |
|------|-------|-------------|
| `NEXT_PUBLIC_CHAIN_ID` | `11155111` | Production |
| `NEXT_PUBLIC_NFT_CONTRACT_ADDRESS` | `0x...` | Production |
| `NEXT_PUBLIC_MARKETPLACE_CONTRACT_ADDRESS` | `0x...` | Production |
| `NEXT_PUBLIC_ALCHEMY_API_KEY` | `your_key` | Production |
| `NEXT_PUBLIC_PINATA_API_KEY` | `your_key` | Production |
| `NEXT_PUBLIC_PINATA_SECRET_API_KEY` | `your_secret` | Production |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://...` | Production |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `your_key` | Production |
| `SUPABASE_SERVICE_ROLE_KEY` | `your_key` | Production |

### Phase 6: Event Indexer Deployment

#### 6.1 Deploy Indexer Service

**Option A: Vercel Serverless Function**
The indexer API routes are already configured to work on Vercel.

**Option B: Separate Server (Railway, Heroku, etc.)**
```bash
# Deploy indexer as background service
# See INDEXER_SETUP.md for detailed instructions
```

#### 6.2 Start Event Indexing

Once deployed, the indexer will automatically start processing blockchain events and populating your Supabase database.

## 🧪 Testing Your Deployment

### 6.1 Verify Contract Deployment

1. Check contracts on Sepolia Etherscan:
   - NFT Contract: `https://sepolia.etherscan.io/address/YOUR_NFT_ADDRESS`
   - Marketplace: `https://sepolia.etherscan.io/address/YOUR_MARKETPLACE_ADDRESS`

2. Verify contract functionality:
```bash
# Test contract interactions
cd contracts
npx hardhat console --network sepolia

# In console:
const nft = await ethers.getContractAt("DeNftToken", "YOUR_NFT_ADDRESS");
const marketplace = await ethers.getContractAt("NFTMarketplace", "YOUR_MARKETPLACE_ADDRESS");

// Test basic functions
await nft.name();
await marketplace.marketplaceFeePercentage();
```

### 6.2 Test Frontend Deployment

1. **Visit your Vercel URL**
2. **Connect MetaMask** (switch to Sepolia network)
3. **Test core functionality:**
   - ✅ Wallet connection
   - ✅ NFT minting
   - ✅ Marketplace browsing
   - ✅ Creating listings
   - ✅ Buying NFTs
   - ✅ Auction functionality

### 6.3 Test IPFS Integration

1. **Mint a test NFT** with image upload
2. **Verify IPFS upload** works correctly
3. **Check image display** in marketplace

### 6.4 Test Database Integration

1. **Create some marketplace activity**
2. **Check Supabase dashboard** for data
3. **Verify API endpoints** return correct data

## 🚨 Troubleshooting Common Issues

### Contract Deployment Issues

**Issue**: `Error: insufficient funds for gas`
```bash
# Solution: Add more Sepolia ETH to your wallet
# Get from: https://faucets.chain.link/sepolia
```

**Issue**: `Error: nonce too high`
```bash
# Solution: Reset MetaMask account
# MetaMask → Settings → Advanced → Reset Account
```

**Issue**: `Error: replacement transaction underpriced`
```bash
# Solution: Increase gas price or wait for network congestion to clear
```

### Frontend Deployment Issues

**Issue**: Build fails with environment variable errors
```bash
# Solution: Ensure all NEXT_PUBLIC_ variables are set
# Check .env.production file and Vercel environment variables
```

**Issue**: Wallet connection fails
```bash
# Solution: Verify chain ID and RPC URLs are correct
# Check browser console for specific errors
```

**Issue**: Contract interactions fail
```bash
# Solution: Verify contract addresses are correct
# Ensure you're on the correct network (Sepolia)
```

### IPFS Upload Issues

**Issue**: Pinata uploads fail
```bash
# Solution: Check API keys and account limits
# Verify network connectivity
```

### Database Issues

**Issue**: API endpoints return errors
```bash
# Solution: Check Supabase configuration
# Verify RLS policies are set correctly
# Check service role key permissions
```

## 🎯 Post-Deployment Optimization

### Performance Optimization

1. **Enable Vercel Analytics**
2. **Set up monitoring** (Sentry, LogRocket)
3. **Optimize images** (use Next.js Image component)
4. **Enable caching** for API routes

### Security Enhancements

1. **Implement rate limiting** on API routes
2. **Add input validation** on all forms
3. **Set up CSP headers** in Next.js config
4. **Monitor contract interactions**

### User Experience

1. **Add loading states** for all async operations
2. **Implement error boundaries**
3. **Add transaction status tracking**
4. **Create user onboarding flow**

## 🏁 Deployment Checklist

Use this checklist to ensure you haven't missed any steps:

### Pre-Deployment
- [ ] All environment variables configured
- [ ] Sepolia ETH in deployment wallet
- [ ] API keys obtained (Alchemy, Pinata, Etherscan)
- [ ] Supabase project created
- [ ] Vercel account set up

### Smart Contracts
- [ ] Contracts deployed to Sepolia
- [ ] Contract addresses copied to frontend config
- [ ] Contracts verified on Etherscan
- [ ] Basic contract functionality tested

### IPFS & Storage
- [ ] Pinata API keys configured
- [ ] Initial assets pinned to IPFS
- [ ] IPFS gateway configured in frontend

### Database
- [ ] Supabase database schema created
- [ ] Environment variables configured
- [ ] API endpoints tested

### Frontend
- [ ] All environment variables set in Vercel
- [ ] Build successful
- [ ] Deployed to Vercel
- [ ] Domain configured (if custom domain)

### Testing
- [ ] Wallet connection works
- [ ] NFT minting functional
- [ ] Marketplace operations work
- [ ] IPFS uploads successful
- [ ] Database indexing operational
- [ ] Mobile responsiveness verified

### Production Ready
- [ ] Error monitoring set up
- [ ] Analytics configured
- [ ] Performance optimized
- [ ] Security measures implemented
- [ ] User documentation created

## 🎉 Congratulations!

If you've completed all steps successfully, your NFT marketplace is now live on Sepolia testnet! 

**Next Steps:**
1. **Monitor** your deployment for issues
2. **Gather user feedback** and iterate
3. **Plan for mainnet deployment** when ready
4. **Scale** your infrastructure as needed

For mainnet deployment, repeat this process but:
- Use Ethereum mainnet instead of Sepolia
- Ensure you have sufficient ETH for deployment costs
- Conduct thorough security audits
- Implement additional monitoring and alerting