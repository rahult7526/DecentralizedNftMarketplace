'use client'

import { useAccount } from 'wagmi'

const stats = [
  { label: 'Total NFTs', value: '12,345' },
  { label: 'Active Listings', value: '1,234' },
  { label: 'Total Volume', value: '456.7 ETH' },
  { label: 'Unique Artists', value: '567' },
]

export function Stats() {
  const { isConnected } = useAccount()

  return (
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
  )
}

