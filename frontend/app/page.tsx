import { Hero } from '@/components/hero'
import { FeaturedNFTs } from '@/components/featured-nfts'
import { Stats } from '@/components/stats'
import { HowItWorks } from '@/components/how-it-works'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <Stats />
        <FeaturedNFTs />
        <HowItWorks />
      </main>
      <Footer />
    </div>
  )
}

