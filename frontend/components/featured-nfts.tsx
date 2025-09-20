'use client'

import Link from 'next/link'
import Image from 'next/image'

const featuredNFTs = [
  {
    id: 1,
    name: 'Cosmic Warrior',
    creator: '0x1234...5678',
    price: '0.5 ETH',
    image: '/api/placeholder/300/300',
  },
  {
    id: 2,
    name: 'Digital Dreams',
    creator: '0x2345...6789',
    price: '1.2 ETH',
    image: '/api/placeholder/300/300',
  },
  {
    id: 3,
    name: 'Pixel Art Master',
    creator: '0x3456...7890',
    price: '0.8 ETH',
    image: '/api/placeholder/300/300',
  },
  {
    id: 4,
    name: 'Abstract Reality',
    creator: '0x4567...8901',
    price: '2.1 ETH',
    image: '/api/placeholder/300/300',
  },
]

export function FeaturedNFTs() {
  return (
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
            <Link key={nft.id} href={`/nft/${nft.id}`}>
              <div className="nft-card group cursor-pointer">
                <div className="aspect-square overflow-hidden">
                  <Image
                    src={nft.image}
                    alt={nft.name}
                    width={300}
                    height={300}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold">{nft.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    by {nft.creator}
                  </p>
                  <p className="mt-2 text-lg font-bold text-primary">
                    {nft.price}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/marketplace"
            className="btn-primary inline-flex items-center px-6 py-3"
          >
            View All NFTs
          </Link>
        </div>
      </div>
    </section>
  )
}

