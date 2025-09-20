import { getDefaultWallets } from '@rainbow-me/rainbowkit'
import { configureChains, createConfig } from 'wagmi'
import { sepolia, localhost, mainnet } from 'wagmi/chains'
import { publicProvider } from 'wagmi/providers/public'

const { chains, publicClient } = configureChains(
  [mainnet, sepolia, localhost],
  [publicProvider()]
)

const { connectors } = getDefaultWallets({
  appName: 'DeNft Marketplace',
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || 'your-project-id',
  chains,
})

export const config = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
})

export { chains }
