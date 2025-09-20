'use client'

import { useState } from 'react'
import { useAccount } from 'wagmi'
import { NFTCard } from '@/components/NFTCard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { 
  User, 
  Package, 
  ShoppingCart, 
  Gavel, 
  Heart, 
  Settings,
  Plus,
  TrendingUp,
  DollarSign
} from 'lucide-react'

// Sample data
const myNFTs = [
  {
    id: '1',
    name: 'My First NFT',
    description: 'The first NFT I ever created',
    image: '/api/placeholder/400/400',
    price: '0.5 ETH',
    owner: '0x1234...5678',
    ownerName: 'You',
    ownerAvatar: '/api/placeholder/32/32',
    likes: 42,
  },
  {
    id: '2',
    name: 'Digital Art #1',
    description: 'Abstract digital artwork',
    image: '/api/placeholder/400/400',
    price: '1.2 ETH',
    owner: '0x1234...5678',
    ownerName: 'You',
    ownerAvatar: '/api/placeholder/32/32',
    likes: 28,
  },
  {
    id: '3',
    name: 'Pixel Masterpiece',
    description: 'Classic pixel art creation',
    image: '/api/placeholder/400/400',
    price: '0.8 ETH',
    owner: '0x1234...5678',
    ownerName: 'You',
    ownerAvatar: '/api/placeholder/32/32',
    isAuction: true,
    highestBid: '1.5 ETH',
    timeLeft: '2d 14h 32m',
    likes: 67,
  },
]

const purchasedNFTs = [
  {
    id: '4',
    name: 'Bought NFT #1',
    description: 'An NFT I purchased',
    image: '/api/placeholder/400/400',
    price: '0.3 ETH',
    owner: '0x1234...5678',
    ownerName: 'You',
    ownerAvatar: '/api/placeholder/32/32',
    likes: 15,
  },
  {
    id: '5',
    name: 'Bought NFT #2',
    description: 'Another purchased NFT',
    image: '/api/placeholder/400/400',
    price: '1.7 ETH',
    owner: '0x1234...5678',
    ownerName: 'You',
    ownerAvatar: '/api/placeholder/32/32',
    likes: 34,
  },
]

const favoriteNFTs = [
  {
    id: '6',
    name: 'Favorite NFT #1',
    description: 'An NFT I really like',
    image: '/api/placeholder/400/400',
    price: '2.1 ETH',
    owner: '0x4567...8901',
    ownerName: 'OtherArtist',
    ownerAvatar: '/api/placeholder/32/32',
    likes: 91,
  },
]

export default function DashboardPage() {
  const { address, isConnected } = useAccount()
  const [activeTab, setActiveTab] = useState('my-nfts')

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Connect Wallet</CardTitle>
            <CardDescription>
              Please connect your wallet to view your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">
              You need to connect your wallet to access your dashboard.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          Manage your NFTs, view your collection, and track your activity
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Package className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{myNFTs.length}</p>
                <p className="text-sm text-muted-foreground">My NFTs</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <ShoppingCart className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{purchasedNFTs.length}</p>
                <p className="text-sm text-muted-foreground">Purchased</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Heart className="w-8 h-8 text-red-600" />
              <div>
                <p className="text-2xl font-bold">{favoriteNFTs.length}</p>
                <p className="text-sm text-muted-foreground">Favorites</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-8 h-8 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold">2.5 ETH</p>
                <p className="text-sm text-muted-foreground">Total Value</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="my-nfts" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            My NFTs
          </TabsTrigger>
          <TabsTrigger value="purchased" className="flex items-center gap-2">
            <ShoppingCart className="w-4 h-4" />
            Purchased
          </TabsTrigger>
          <TabsTrigger value="favorites" className="flex items-center gap-2">
            <Heart className="w-4 h-4" />
            Favorites
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Activity
          </TabsTrigger>
        </TabsList>

        {/* My NFTs */}
        <TabsContent value="my-nfts" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">My NFTs</h2>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create New
            </Button>
          </div>

          {myNFTs.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <div className="space-y-2">
                  <Package className="w-12 h-12 mx-auto text-muted-foreground" />
                  <h3 className="text-lg font-semibold">No NFTs created yet</h3>
                  <p className="text-muted-foreground">
                    Start creating your first NFT to get started
                  </p>
                  <Button className="mt-4">
                    <Plus className="w-4 h-4 mr-2" />
                    Create NFT
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {myNFTs.map((nft) => (
                <NFTCard
                  key={nft.id}
                  {...nft}
                  onList={() => console.log('List', nft.id)}
                  onLike={() => console.log('Like', nft.id)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Purchased NFTs */}
        <TabsContent value="purchased" className="space-y-6">
          <h2 className="text-2xl font-semibold">Purchased NFTs</h2>
          
          {purchasedNFTs.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <div className="space-y-2">
                  <ShoppingCart className="w-12 h-12 mx-auto text-muted-foreground" />
                  <h3 className="text-lg font-semibold">No purchases yet</h3>
                  <p className="text-muted-foreground">
                    Start exploring the marketplace to find NFTs you love
                  </p>
                  <Button className="mt-4">
                    Browse Marketplace
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {purchasedNFTs.map((nft) => (
                <NFTCard
                  key={nft.id}
                  {...nft}
                  onLike={() => console.log('Like', nft.id)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Favorites */}
        <TabsContent value="favorites" className="space-y-6">
          <h2 className="text-2xl font-semibold">Favorite NFTs</h2>
          
          {favoriteNFTs.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <div className="space-y-2">
                  <Heart className="w-12 h-12 mx-auto text-muted-foreground" />
                  <h3 className="text-lg font-semibold">No favorites yet</h3>
                  <p className="text-muted-foreground">
                    Like NFTs to add them to your favorites
                  </p>
                  <Button className="mt-4">
                    Browse NFTs
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {favoriteNFTs.map((nft) => (
                <NFTCard
                  key={nft.id}
                  {...nft}
                  onBid={() => console.log('Bid on', nft.id)}
                  onLike={() => console.log('Unlike', nft.id)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Activity */}
        <TabsContent value="activity" className="space-y-6">
          <h2 className="text-2xl font-semibold">Recent Activity</h2>
          
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">NFT Created</p>
                    <p className="text-xs text-muted-foreground">2 hours ago</p>
                  </div>
                  <Badge variant="outline">My First NFT</Badge>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">NFT Listed</p>
                    <p className="text-xs text-muted-foreground">1 day ago</p>
                  </div>
                  <Badge variant="outline">Digital Art #1</Badge>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Auction Started</p>
                    <p className="text-xs text-muted-foreground">3 days ago</p>
                  </div>
                  <Badge variant="outline">Pixel Masterpiece</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
