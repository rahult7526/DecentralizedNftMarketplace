import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { sepolia, localhost } from 'wagmi/chains'

export const config = getDefaultConfig({
  appName: 'DeNft Marketplace',
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || 'your-project-id',
  chains: [sepolia, localhost],
  ssr: true,
})

