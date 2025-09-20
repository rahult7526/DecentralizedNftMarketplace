# 🚀 DeNft Marketplace - Bootstrap Commands

Complete step-by-step commands to scaffold the entire project from scratch.

## 📋 Prerequisites

```bash
# Check Node.js version (requires 18+)
node --version

# Install pnpm globally
npm install -g pnpm

# Verify pnpm installation
pnpm --version
```

## 🏗️ Complete Bootstrap Process

### Step 1: Create Project Structure
```bash
# Create project directory
mkdir denft-marketplace
cd denft-marketplace

# Initialize root package.json
npm init -y
```

### Step 2: Create Next.js Client
```bash
# Create Next.js 14 app with TypeScript and Tailwind
npx create-next-app@latest app-client --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

# Navigate to client directory
cd app-client

# Install additional dependencies
npm install @radix-ui/react-slot @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-toast lucide-react class-variance-authority clsx tailwind-merge @tailwindcss/forms @tailwindcss/typography tailwindcss-animate wagmi @rainbow-me/rainbowkit viem ethers ipfs-http-client pinata-sdk react-hook-form @hookform/resolvers zod react-dropzone react-hot-toast framer-motion

# Install dev dependencies
npm install --save-dev prettier prettier-plugin-tailwindcss

# Go back to root
cd ..
```

### Step 3: Initialize Hardhat Contracts
```bash
# Create contracts directory
mkdir contracts
cd contracts

# Initialize Hardhat with TypeScript
npx hardhat init --typescript

# Install OpenZeppelin contracts
npm install @openzeppelin/contracts

# Install additional dev dependencies
npm install --save-dev hardhat-gas-reporter solidity-coverage

# Go back to root
cd ..
```

### Step 4: Install Root Dependencies
```bash
# Install monorepo dependencies
npm install concurrently typescript

# Install pnpm for workspace management
npm install -g pnpm
```

### Step 5: Copy Generated Files
```bash
# Copy all the generated files from this scaffold:
# - Root package.json
# - app-client/ files (next.config.js, tsconfig.json, etc.)
# - contracts/ files (hardhat.config.ts, contracts/, scripts/, test/)
# - env.example
# - .gitignore
# - .prettierrc
# - README.md
```

### Step 6: Install All Dependencies
```bash
# Install dependencies for all workspaces
pnpm install:all
```

### Step 7: Configure Environment
```bash
# Copy environment template
cp env.example .env.local

# Edit .env.local with your configuration
# Add your Alchemy/Infura URL, private key, API keys, etc.
```

### Step 8: Verify Setup
```bash
# Compile contracts
pnpm compile:contracts

# Run contract tests
pnpm test:contracts

# Type check client
pnpm type-check:client

# Build client
pnpm build:client
```

## 🚀 Development Commands

### Start Development
```bash
# Option 1: Start everything (client + contracts node)
pnpm dev

# Option 2: Start separately
# Terminal 1: Start client
pnpm dev:client

# Terminal 2: Start Hardhat node
pnpm --filter contracts node

# Terminal 3: Deploy contracts
pnpm deploy:contracts
```

### Access Applications
- **Frontend**: http://localhost:3000
- **Hardhat Network**: http://localhost:8545

## 🧪 Testing Commands

```bash
# Run all tests
pnpm test

# Run only contract tests
pnpm test:contracts

# Run contract tests with coverage
pnpm --filter contracts coverage

# Run specific test file
pnpm --filter contracts test test/DeNftToken.test.ts
```

## 🚀 Deployment Commands

### Local Deployment
```bash
# Deploy to local Hardhat network
pnpm deploy:contracts
```

### Sepolia Testnet Deployment
```bash
# Deploy to Sepolia testnet
pnpm deploy:sepolia

# Verify contracts on Etherscan
pnpm verify:contracts
```

## 🔧 Utility Commands

### Build Commands
```bash
# Build everything
pnpm build

# Build only client
pnpm build:client

# Compile only contracts
pnpm compile:contracts
```

### Clean Commands
```bash
# Clean everything
pnpm clean:all

# Clean only client
pnpm --filter app-client clean

# Clean only contracts
pnpm --filter contracts clean
```

### Linting & Formatting
```bash
# Run linting
pnpm lint:client

# Format code
pnpm --filter app-client exec prettier --write .

# Check formatting
pnpm --filter app-client exec prettier --check .
```

## 🛠️ Troubleshooting Commands

### Reset Everything
```bash
# Remove all node_modules
rm -rf node_modules
rm -rf app-client/node_modules
rm -rf contracts/node_modules

# Remove lock files
rm -f pnpm-lock.yaml
rm -f app-client/package-lock.json
rm -f contracts/package-lock.json

# Reinstall everything
pnpm install:all
```

### Reset Hardhat
```bash
# Clean Hardhat cache
pnpm --filter contracts clean

# Recompile contracts
pnpm compile:contracts

# Reset Hardhat network
pnpm --filter contracts node --reset
```

### Reset Next.js
```bash
# Clear Next.js cache
rm -rf app-client/.next
rm -rf app-client/out

# Restart development server
pnpm dev:client
```

## 📋 Pre-flight Checklist

Before running commands, ensure:
- [ ] Node.js 18+ installed
- [ ] pnpm installed globally
- [ ] Git repository initialized
- [ ] Environment variables configured
- [ ] Wallet has test ETH (for Sepolia)
- [ ] API keys are valid

## 🎯 Quick Start (After Bootstrap)

```bash
# 1. Start development
pnpm dev

# 2. Open browser to http://localhost:3000

# 3. Check Hardhat network at http://localhost:8545

# 4. Deploy contracts
pnpm deploy:contracts

# 5. Start building features!
```

---

**All set!** 🎉 Your DeNft Marketplace monorepo is ready for development.