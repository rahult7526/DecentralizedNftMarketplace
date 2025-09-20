# CI/CD Setup Guide

This document explains how to set up the CI/CD pipeline for the DeNft Marketplace project using GitHub Actions.

## 🔧 Required GitHub Secrets

You need to configure the following secrets in your GitHub repository settings (`Settings > Secrets and variables > Actions`):

### Required Secrets

#### Blockchain/Web3 Secrets
- **`PRIVATE_KEY`** - Private key for contract deployment (for testnet deployment)
  - **Format**: Hexadecimal string without `0x` prefix
  - **Example**: `ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
  - **Security**: Use a separate wallet for CI/CD, never your main wallet

- **`ALCHEMY_API_KEY`** - Alchemy API key for blockchain connectivity
  - **Format**: String API key from Alchemy dashboard
  - **Example**: `your-alchemy-api-key-here`
  - **Get from**: [https://www.alchemy.com/](https://www.alchemy.com/)

#### IPFS/Storage Secrets
- **`PINATA_API_KEY`** - Pinata API key for IPFS uploads
  - **Format**: String API key from Pinata dashboard
  - **Example**: `your-pinata-api-key`
  - **Get from**: [https://www.pinata.cloud/](https://www.pinata.cloud/)

- **`PINATA_SECRET_API_KEY`** - Pinata secret key for IPFS uploads
  - **Format**: String secret key from Pinata dashboard
  - **Example**: `your-pinata-secret-key`
  - **Get from**: Pinata dashboard > API Keys

### Optional Secrets (for enhanced functionality)

#### Sepolia Testnet Deployment
- **`SEPOLIA_PRIVATE_KEY`** - Private key for Sepolia testnet deployment
  - **Format**: Same as PRIVATE_KEY but for Sepolia network
  - **Security**: Separate key from mainnet operations

#### Contract Verification
- **`ETHERSCAN_API_KEY`** - API key for contract verification on Etherscan
  - **Format**: String API key from Etherscan
  - **Get from**: [https://etherscan.io/apis](https://etherscan.io/apis)

#### Deployment (if using Vercel)
- **`VERCEL_TOKEN`** - Vercel deployment token
- **`VERCEL_ORG_ID`** - Vercel organization ID
- **`VERCEL_PROJECT_ID`** - Vercel project ID

## 📝 How to Set Up Secrets

### 1. Navigate to GitHub Repository Settings
1. Go to your GitHub repository
2. Click on `Settings` tab
3. In the left sidebar, click `Secrets and variables` > `Actions`

### 2. Add Each Secret
1. Click `New repository secret`
2. Enter the secret name (exactly as listed above)
3. Enter the secret value
4. Click `Add secret`

### 3. Verify Secrets
After adding all secrets, you should see them listed in the repository secrets section.

## 🚀 CI/CD Pipeline Overview

The pipeline consists of several jobs that run in parallel and sequence:

### Pipeline Jobs

1. **Setup** - Install dependencies and cache them
2. **Contracts** - Compile and test smart contracts
3. **Frontend Lint** - ESLint, TypeScript checks, and code formatting
4. **Frontend Build** - Build the Next.js application
5. **E2E Tests** - Run Playwright end-to-end tests with local Hardhat node
6. **Security** - Run security audits
7. **Deploy** - Deploy to testnet/production (only on main branch)

### Pipeline Triggers

- **Push to main/develop branches** - Full pipeline
- **Pull requests to main/develop** - All jobs except deployment
- **Manual trigger** - Can be run manually from GitHub Actions tab

## 🔍 Pipeline Features

### Contract Testing
- Compiles all smart contracts
- Runs comprehensive test suite including security tests
- Generates coverage reports
- Tests reentrancy protection, edge cases, and integration flows

### Frontend Testing
- TypeScript type checking
- ESLint linting with Next.js rules
- Prettier code formatting check
- Production build verification
- E2E testing with Playwright

### Security Checks
- npm audit for dependency vulnerabilities
- Contract security testing
- Gas usage analysis

### Performance Monitoring
- Build size analysis
- Test execution time tracking
- Coverage reporting

## 🛠️ Local Development Commands

### Testing Commands
```bash
# Run all tests
pnpm test:all

# Run contract tests only
pnpm test:contracts

# Run E2E tests only
pnpm test:e2e

# Run with coverage
cd contracts && npx hardhat coverage
```

### Build Commands
```bash
# Build everything
pnpm build

# Build frontend only
pnpm build:client

# Compile contracts only
pnpm compile:contracts
```

### Lint Commands
```bash
# Lint frontend
pnpm lint:client

# Type check
pnpm type-check:client

# Format code
cd app-client && npx prettier --write "**/*.{ts,tsx,js,jsx,json,css,md}"
```

## 📊 Monitoring and Debugging

### GitHub Actions Dashboard
- Monitor pipeline status at `https://github.com/YOUR_USERNAME/YOUR_REPO/actions`
- View logs for each job
- Download artifacts (test reports, build outputs)

### Test Reports
- Playwright generates HTML reports for E2E tests
- Contract tests show gas usage and coverage
- Build artifacts are preserved for debugging

### Common Issues and Solutions

#### Secret Configuration Issues
- **Error**: `Error: missing required environment variable`
- **Solution**: Verify all required secrets are set with correct names

#### Contract Deployment Failures
- **Error**: `Error: insufficient funds`
- **Solution**: Ensure test wallet has enough ETH for gas fees

#### E2E Test Timeouts
- **Error**: `Test timeout exceeded`
- **Solution**: Tests run with 30-minute timeout; check for infinite loops

#### Build Failures
- **Error**: `Module not found` or `Type error`
- **Solution**: Check dependencies and TypeScript configurations

## 🔐 Security Best Practices

### Secret Management
1. **Use separate wallets** for CI/CD (never your main wallet)
2. **Rotate secrets regularly** (especially API keys)
3. **Use environment-specific keys** (different keys for staging/production)
4. **Monitor usage** of API keys through provider dashboards

### Access Control
1. **Limit repository access** to essential team members
2. **Use branch protection** rules for main/develop branches
3. **Require pull request reviews** before merging
4. **Enable status checks** to prevent merging failing builds

### Network Security
1. **Use testnet for CI/CD** (Sepolia, Goerli)
2. **Never deploy to mainnet** from CI/CD without manual approval
3. **Monitor contract deployments** and verify on block explorers

## 🎯 Next Steps

1. **Set up all required secrets** in your GitHub repository
2. **Push changes to trigger** the first pipeline run
3. **Monitor the pipeline** and fix any issues
4. **Configure branch protection** rules
5. **Set up deployment** to your preferred hosting platform

## 📞 Support

If you encounter issues:
1. Check the [GitHub Actions documentation](https://docs.github.com/en/actions)
2. Review the pipeline logs for specific error messages
3. Verify all secrets are correctly configured
4. Check that test wallets have sufficient funds for gas fees

Remember to keep your secrets secure and never commit them to the repository!