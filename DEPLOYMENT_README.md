# 🚀 Deployment Quick Start

This README provides quick deployment commands and essential information for deploying the DeNft Marketplace to production.

## 📋 Quick Commands

### Environment Setup

```bash
# Set up environment variables interactively
pnpm setup:env

# Or set up manually by copying example files
cp contracts/.env.example contracts/.env
cp app-client/.env.production.example app-client/.env.production
```

### Smart Contract Deployment

```bash
# Deploy to Sepolia testnet
pnpm deploy:contracts:sepolia

# Deploy full marketplace with testing
pnpm deploy:marketplace:sepolia
```

### Frontend Deployment

```bash
# Deploy to Vercel (production)
pnpm vercel:deploy

# Deploy preview
pnpm vercel:preview
```

### Event Indexer

```bash
# Start indexer in development
pnpm indexer:dev

# Start background indexer service
pnpm indexer:start

# Check indexer status
pnpm indexer:status
```

### Testing

```bash
# Run all tests
pnpm test:all

# Run contract tests only
pnpm test:contracts

# Run security tests
pnpm --filter contracts test:security

# Run E2E tests
pnpm test:e2e
```

## 🔧 Required Environment Variables

### Contracts (.env)

```env
PRIVATE_KEY="your_wallet_private_key_without_0x"
ALCHEMY_URL="https://eth-sepolia.g.alchemy.com/v2/your_api_key"
ETHERSCAN_API_KEY="your_etherscan_api_key"
```

### Frontend (.env.production)

```env
# Filled after contract deployment
NEXT_PUBLIC_CHAIN_ID="11155111"
NEXT_PUBLIC_NFT_CONTRACT_ADDRESS="0x..."
NEXT_PUBLIC_MARKETPLACE_CONTRACT_ADDRESS="0x..."

# API Keys
NEXT_PUBLIC_ALCHEMY_API_KEY="your_alchemy_api_key"
NEXT_PUBLIC_PINATA_API_KEY="your_pinata_api_key"
NEXT_PUBLIC_PINATA_SECRET_API_KEY="your_pinata_secret_key"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your_supabase_anon_key"
SUPABASE_SERVICE_ROLE_KEY="your_supabase_service_role_key"
```

## 📊 Cost Estimates

### Deployment Costs (Sepolia Testnet)

- **Contract Deployment**: ~0.05-0.15 ETH (free Sepolia ETH)
- **Transaction Testing**: ~0.01-0.05 ETH

### Monthly Operating Costs

- **Vercel Pro**: $20/month
- **Alchemy Growth**: $49/month
- **Pinata Pro**: $20/month
- **Supabase Pro**: $25/month
- **Total**: ~$114/month

## 🔗 Quick Links

### Services Setup

- [Alchemy Dashboard](https://dashboard.alchemy.com/)
- [Pinata Dashboard](https://app.pinata.cloud/)
- [Supabase Dashboard](https://app.supabase.com/)
- [Vercel Dashboard](https://vercel.com/dashboard)

### Testing & Faucets

- [Sepolia Faucet](https://faucets.chain.link/sepolia)
- [Sepolia Etherscan](https://sepolia.etherscan.io/)
- [MetaMask Network Config](https://chainlist.org/chain/11155111)

### Documentation

- [Full Deployment Guide](./DEPLOYMENT_GUIDE.md) - Comprehensive step-by-step guide
- [Production Checklist](./PRODUCTION_CHECKLIST.md) - Pre-launch verification
- [Security Checklist](./SECURITY_CHECKLIST.md) - Smart contract security audit guide
- [Soroban Migration Plan](./SOROBAN_MIGRATION_PLAN.md) - Multi-chain expansion strategy
- [CI/CD Setup](./CI_SETUP.md) - GitHub Actions configuration
- [Testing Guide](./TESTING.md) - Testing strategy and execution

## ⚡ Quick Deployment Flow

```bash
# 1. Setup environment
pnpm setup:env

# 2. Deploy contracts
pnpm deploy:contracts:sepolia

# 3. Update frontend config with contract addresses
# (Copy addresses from deployment output)

# 4. Deploy frontend
pnpm vercel:deploy

# 5. Start indexer
pnpm indexer:start

# 6. Test everything works
pnpm test:e2e
```

## 🚨 Pre-Deployment Checklist

- [ ] Sepolia ETH in deployment wallet (min 0.05 ETH)
- [ ] All API keys obtained and configured
- [ ] Supabase database schema created
- [ ] Contract addresses updated in frontend config
- [ ] All environment variables set
- [ ] Tests passing

## 🆘 Emergency Commands

```bash
# Stop all services
pnpm indexer:stop

# Restart indexer
pnpm indexer:restart

# Check logs
vercel logs

# Rollback deployment
vercel rollback
```

## 📞 Support

If you encounter issues:

1. Check the [Troubleshooting section](./DEPLOYMENT_GUIDE.md#troubleshooting) in the full guide
2. Verify all environment variables are set correctly
3. Ensure your wallet has sufficient Sepolia ETH
4. Check service status dashboards

---

**Ready to deploy?** Start with `pnpm setup:env` and follow the deployment flow above! 🚀
