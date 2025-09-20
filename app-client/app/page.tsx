'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { NFTCard } from '@/components/NFTCard'
import { ConnectWalletButton } from '@/components/ConnectWalletButton'
import { Package, ShoppingCart, Gavel, TrendingUp } from 'lucide-react'

// Sample featured NFTs
const featuredNFTs = [
  {
    id: '1',
    name: 'Cosmic Warrior',
    description: 'A legendary warrior from the cosmic realm',
    image: '/api/placeholder/400/400',
    price: '0.5 ETH',
    owner: '0x1234...5678',
    ownerName: 'CosmicArtist',
    ownerAvatar: '/api/placeholder/32/32',
    likes: 42,
  },
  {
    id: '2',
    name: 'Digital Dreams',
    description: 'Abstract digital art representing dreams',
    image: '/api/placeholder/400/400',
    price: '1.2 ETH',
    owner: '0x2345...6789',
    ownerName: 'DreamWeaver',
    ownerAvatar: '/api/placeholder/32/32',
    likes: 28,
  },
  {
    id: '3',
    name: 'Pixel Art Master',
    description: 'Classic pixel art with modern twist',
    image: '/api/placeholder/400/400',
    price: '0.8 ETH',
    owner: '0x3456...7890',
    ownerName: 'PixelMaster',
    ownerAvatar: '/api/placeholder/32/32',
    isAuction: true,
    highestBid: '1.5 ETH',
    timeLeft: '2d 14h 32m',
    likes: 67,
  },
  {
    id: '4',
    name: 'Abstract Reality',
    description: 'Exploring the boundaries of reality',
    image: '/api/placeholder/400/400',
    price: '2.1 ETH',
    owner: '0x4567...8901',
    ownerName: 'RealityBender',
    ownerAvatar: '/api/placeholder/32/32',
    likes: 91,
  },
]

const stats = [
  { label: 'Total NFTs', value: '12,345' },
  { label: 'Active Listings', value: '1,234' },
  { label: 'Total Volume', value: '456.7 ETH' },
  { label: 'Unique Artists', value: '567' },
]

const features = [
  {
    icon: Package,
    title: 'Create NFTs',
    description: 'Upload your digital art and create unique NFTs with custom metadata and attributes.',
  },
  {
    icon: ShoppingCart,
    title: 'Buy & Sell',
    description: 'Trade NFTs with fixed prices or participate in exciting auctions.',
  },
  {
    icon: Gavel,
    title: 'Auction System',
    description: 'Create time-based auctions with automatic bidding and winner selection.',
  },
  {
    icon: TrendingUp,
    title: 'Track Value',
    description: 'Monitor your collection value and track market trends.',
  },
]

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32">
        <div className="container">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-6xl">
              Discover, Collect, and Trade
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent block">
                Unique NFTs
              </span>
            </h1>
            
            <p className="mb-8 text-lg text-muted-foreground sm:text-xl">
              The decentralized marketplace for in-game assets and digital art. 
              Create, buy, and sell NFTs with zero platform fees.
            </p>

            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center mb-12">
              <Button asChild size="lg">
                <Link href="/market">
                  Explore Marketplace
                </Link>
              </Button>
              
              <Button asChild variant="outline" size="lg">
                <Link href="/mint">
                  Create NFT
                </Link>
              </Button>
            </div>

            <div className="flex justify-center">
              <ConnectWalletButton />
            </div>
          </div>
        </div>

        {/* Background decoration */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute left-1/2 top-0 -z-10 -translate-x-1/2 blur-3xl xl:-top-6" aria-hidden="true">
            <div
              className="aspect-[1155/678] w-[72.1875rem] bg-gradient-to-tr from-blue-600 to-purple-600 opacity-30"
              style={{
                clipPath:
                  'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
              }}
            />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16">
        <div className="container">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl font-bold text-primary md:text-4xl">
                  {stat.value}
                </div>
                <div className="mt-2 text-sm text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured NFTs */}
      <section className="py-16">
        <div className="container">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold">Featured NFTs</h2>
            <p className="text-muted-foreground">
              Discover the most popular and trending NFTs on our marketplace
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {featuredNFTs.map((nft) => (
              <NFTCard
                key={nft.id}
                {...nft}
                onBid={() => console.log('Bid on', nft.id)}
                onLike={() => console.log('Like', nft.id)}
              />
            ))}
          </div>

          <div className="mt-12 text-center">
            <Button asChild size="lg">
              <Link href="/market">
                View All NFTs
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="container">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold">How It Works</h2>
            <p className="text-muted-foreground">
              Get started with DeNft Marketplace in just a few simple steps
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <Card key={index} className="text-center">
                <CardHeader>
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
