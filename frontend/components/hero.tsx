'use client'

import { ConnectButton } from '@rainbow-me/rainbowkit'
import Link from 'next/link'

export function Hero() {
  return (
    <section className="relative py-20 md:py-32">
      <div className="container">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-6xl">
            Discover, Collect, and Trade
            <span className="gradient-text block">Unique NFTs</span>
          </h1>
          
          <p className="mb-8 text-lg text-muted-foreground sm:text-xl">
            The decentralized marketplace for in-game assets and digital art. 
            Create, buy, and sell NFTs with zero platform fees.
          </p>

          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/marketplace"
              className="btn-primary inline-flex items-center justify-center px-8 py-3 text-base font-medium"
            >
              Explore Marketplace
            </Link>
            
            <Link
              href="/mint"
              className="btn-secondary inline-flex items-center justify-center px-8 py-3 text-base font-medium"
            >
              Create NFT
            </Link>
          </div>

          <div className="mt-12 flex justify-center">
            <ConnectButton />
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
  )
}

