# DeNft Marketplace - Monorepo (Under_Development)

A decentralized NFT marketplace for in-game assets and digital art, built with Next.js 14 and Hardhat.

## 🏗️ Project Structure

```
denft-marketplace/
├── app-client/          # Next.js 14 + TypeScript + Tailwind + ShadCN UI
├── contracts/           # Hardhat + TypeScript + OpenZeppelin
├── package.json         # Root package.json with monorepo scripts
├── env.example         # Environment variables template
└── README.md           # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- pnpm (recommended) or npm
- Git

### Bootstrap Commands

```bash
# 1. Create the project structure
mkdir denft-marketplace
cd denft-marketplace

# 2. Initialize the monorepo
npm init -y
npm install -g pnpm

# 3. Create app-client with Next.js 14
npx create-next-app@latest app-client --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
cd app-client
npm install @radix-ui/react-slot @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-toast lucide-react class-variance-authority clsx tailwind-merge @tailwindcss/forms @tailwindcss/typography tailwindcss-animate wagmi @rainbow-me/rainbowkit viem ethers ipfs-http-client pinata-sdk react-hook-form @hookform/resolvers zod react-dropzone react-hot-toast framer-motion
cd ..

# 4. Initialize Hardhat for contracts
mkdir contracts
cd contracts
npx hardhat init --typescript
npm install @openzeppelin/contracts
cd ..

# 5. Install root dependencies
npm install concurrently typescript

# 6. Copy the provided files
# (Copy all the generated files from this scaffold)

# 7. Install all dependencies
pnpm install:all

# 8. Set up environment variables
cp env.example .env.local
# Edit .env.local with your configuration

# 9. Start development
pnpm dev
```

## 📋 Available Scripts

### Root Level Commands
```bash
# Install all dependencies
pnpm install:all

# Development (runs both client and contracts node)
pnpm dev

# Build everything
pnpm build

# Run all tests
pnpm test

# Clean all build artifacts
pnpm clean:all
```

### Client Commands
```bash
# Start Next.js development server
pnpm dev:client

# Build for production
pnpm build:client

# Start production server
pnpm start:client

# Run linting
pnpm lint:client

# Type checking
pnpm type-check:client
```

### Contract Commands
```bash
# Compile contracts
pnpm compile:contracts

# Run contract tests
pnpm test:contracts

# Deploy to local network
pnpm deploy:contracts

# Deploy to Sepolia testnet
pnpm deploy:sepolia

# Verify contracts on Etherscan
pnpm verify:contracts
```

## 🔧 Environment Setup

1. **Copy environment variables:**
   ```bash
   cp env.example .env.local
   ```

2. **Configure your environment:**
   - Add your Alchemy/Infura URL
   - Add your private key for deployment
   - Add your Etherscan API key
   - Add your Pinata API keys
   - Set your app URL

3. **Get testnet ETH:**
   - Visit [Sepolia Faucet](https://sepoliafaucet.com/)
   - Get test ETH for deployment

## 🚀 Development Workflow

### 1. Start Development
```bash
# Terminal 1: Start Next.js client
pnpm dev:client

# Terminal 2: Start Hardhat node
pnpm --filter contracts node

# Terminal 3: Deploy contracts
pnpm deploy:contracts
```

### 2. Access the Application via localhost

### 3. Deploy to Sepolia
```bash
# Deploy contracts to Sepolia testnet
pnpm deploy:sepolia

# Verify contracts on Etherscan
pnpm verify:contracts
```

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run only contract tests
pnpm test:contracts

# Run with coverage
pnpm --filter contracts coverage
```

## 📦 Key Features

### Frontend (app-client)
- ✅ Next.js 14 with App Router
- ✅ TypeScript for type safety
- ✅ TailwindCSS for styling
- ✅ ShadCN UI components
- ✅ Wallet integration ready
- ✅ IPFS integration ready
- ✅ Responsive design

### Smart Contracts (contracts)
- ✅ Hardhat development environment
- ✅ TypeScript support
- ✅ OpenZeppelin contracts
- ✅ ERC-721 NFT contract
- ✅ Comprehensive testing
- ✅ Deployment scripts
- ✅ Etherscan verification

## 🔗 Integration Points

### Wallet Connection
The client is set up with Wagmi + RainbowKit for easy wallet integration.

### IPFS Storage
Pinata integration is configured for metadata storage.

### Contract Interaction
Ethers.js is set up for contract interactions.

## 📚 Next Steps

1. **Configure Environment**: Update `.env.local` with your keys
2. **Deploy Contracts**: Run deployment scripts
3. **Connect Wallet**: Implement wallet connection in the client
4. **Add IPFS**: Implement file upload and metadata storage
5. **Build Features**: Create NFT minting, marketplace, and trading features
6. **Test Everything**: Run comprehensive tests
7. **Security Review**: Follow security checklist and audit guidelines
8. **Deploy to Production**: Deploy to mainnet when ready
9. **Consider Multi-chain**: Evaluate Soroban migration for expanded ecosystem

## 🛠️ Troubleshooting

### Common Issues
```bash
# Clear node_modules and reinstall
rm -rf node_modules
rm -rf app-client/node_modules
rm -rf contracts/node_modules
pnpm install:all

# Reset Hardhat
pnpm --filter contracts clean
pnpm compile:contracts

# Clear Next.js cache
rm -rf app-client/.next
pnpm dev:client
```

## 📄 License

MIT License - see LICENSE file for details.

---

**Ready to build!** 🚀 Start with `pnpm install:all` and `pnpm dev` to begin development soon.
