# Frontend Setup Guide

## Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- Wallet Connect Project ID (get from [WalletConnect Cloud](https://cloud.walletconnect.com/))

## Quick Start

### 1. Install Dependencies

```bash
# Install all dependencies
pnpm install

# Or with npm
npm install
```

### 2. Environment Setup

```bash
# Copy environment template
cp env.example .env.local

# Edit .env.local with your configuration
```

Required environment variables:
```bash
# Wallet Connect (required for wallet connection)
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_wallet_connect_project_id_here

# Pinata (for IPFS uploads)
PINATA_API_KEY=your_pinata_api_key_here
PINATA_SECRET_API_KEY=your_pinata_secret_key_here
NEXT_PUBLIC_PINATA_GATEWAY=https://gateway.pinata.cloud/ipfs/

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_CHAIN_ID=11155111
```

### 3. Start Development Server

```bash
# Start Next.js development server
pnpm dev

# Or with npm
npm run dev
```

### 4. Open Browser

Navigate to [http://localhost:3000](http://localhost:3000)

## Features

### ✅ Wallet Connection
- **MetaMask** integration
- **WalletConnect** support
- **RainbowKit** UI components
- **Multi-chain** support (Mainnet, Sepolia, Localhost)

### ✅ UI Components
- **ShadCN UI** components
- **TailwindCSS** styling
- **Responsive** design
- **Dark/Light** theme support

### ✅ Pages
- **Home** - Landing page with featured NFTs
- **Market** - Browse and search NFTs
- **Mint** - Create new NFTs with IPFS upload
- **Dashboard** - Manage your NFTs and activity

### ✅ NFT Features
- **Image upload** with drag & drop
- **Metadata creation** with attributes
- **IPFS integration** via Pinata
- **Auction support** with bidding
- **Fixed price** listings

## Wallet Connection

The app supports multiple wallet providers:

1. **MetaMask** - Browser extension
2. **WalletConnect** - Mobile wallets
3. **Coinbase Wallet** - Browser extension
4. **Rainbow** - Mobile app

### Getting Wallet Connect Project ID

1. Go to [WalletConnect Cloud](https://cloud.walletconnect.com/)
2. Create a new project
3. Copy your Project ID
4. Add it to your `.env.local` file

## IPFS Integration

The app uses Pinata for IPFS storage:

1. Sign up at [Pinata](https://pinata.cloud/)
2. Get your API keys from the dashboard
3. Add them to your `.env.local` file

## Available Scripts

```bash
# Development
pnpm dev                 # Start development server
pnpm build              # Build for production
pnpm start              # Start production server

# Code Quality
pnpm lint               # Run ESLint
pnpm type-check         # Run TypeScript checks

# Testing
pnpm test:api           # Test API endpoints

# Utilities
pnpm clean              # Clean build artifacts
```

## Project Structure

```
app-client/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── mint/              # Mint page
│   ├── market/            # Market page
│   ├── dashboard/         # Dashboard page
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   └── providers.tsx      # Wagmi + RainbowKit providers
├── components/            # React components
│   ├── ui/               # ShadCN UI components
│   ├── Header.tsx        # Navigation header
│   ├── NFTCard.tsx       # NFT display card
│   └── ConnectWalletButton.tsx
├── lib/                  # Utilities
│   ├── pinata.ts         # IPFS/Pinata utilities
│   ├── wagmi.ts          # Wagmi configuration
│   └── utils.ts          # Helper functions
└── scripts/              # Utility scripts
    └── test-pinata-api.js
```

## Customization

### Themes
The app uses CSS variables for theming. Edit `app/globals.css` to customize:

```css
:root {
  --primary: 221.2 83.2% 53.3%;
  --primary-foreground: 210 40% 98%;
  /* ... other variables */
}
```

### Components
All UI components are in `components/ui/` and can be customized or extended.

### Styling
Uses TailwindCSS with custom configuration in `tailwind.config.js`.

## Troubleshooting

### Common Issues

1. **Wallet not connecting**
   - Check WalletConnect Project ID
   - Ensure MetaMask is installed
   - Try refreshing the page

2. **IPFS uploads failing**
   - Verify Pinata API keys
   - Check network connection
   - Ensure file size is reasonable

3. **Build errors**
   - Run `pnpm type-check` to find TypeScript errors
   - Check for missing dependencies
   - Clear `.next` folder and rebuild

### Getting Help

- Check the browser console for errors
- Verify environment variables are set correctly
- Ensure all dependencies are installed
- Check the Next.js documentation for common issues

## Production Deployment

### Build for Production

```bash
# Build the application
pnpm build

# Start production server
pnpm start
```

### Environment Variables for Production

Make sure to set these in your production environment:

- `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID`
- `PINATA_API_KEY`
- `PINATA_SECRET_API_KEY`
- `NEXT_PUBLIC_PINATA_GATEWAY`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_CHAIN_ID`

### Deployment Platforms

The app can be deployed to:
- **Vercel** (recommended for Next.js)
- **Netlify**
- **AWS Amplify**
- **Railway**
- Any platform supporting Node.js

## Next Steps

1. **Connect your wallet** to test the UI
2. **Upload an image** to test IPFS integration
3. **Create an NFT** to test the minting flow
4. **Customize the UI** to match your brand
5. **Add more features** as needed

The frontend is now ready for development and testing! 🚀
